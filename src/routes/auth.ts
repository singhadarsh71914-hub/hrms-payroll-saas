import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma.ts';
import { AppError } from '../middleware/error.ts';
import { AuditService, AuditAction } from '../services/audit.service.ts';
import { validate } from '../middleware/validate.ts';
import { registerSchema, loginSchema, setPasswordSchema } from '../schemas/auth.schema.ts';
import { authLimiter } from '../middleware/security.ts';
import { authenticate } from '../middleware/auth.ts';

// @ts-ignore
import { forgotPassword, resetPassword, forgotPasswordLimiter, resetPasswordLimiter } from '../controllers/authResetController.ts';
// @ts-ignore
import { sendVerification, verifyEmail, resendVerificationLimiter } from '../controllers/emailVerificationController.ts';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateAccessToken = (user: any) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      company_id: user.company_id,
      email: user.email,
      email_verified: user.email_verified,
      employee_id: user.employee?.id 
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = async (userId: string) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const refreshToken = await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: hashedToken,
      expires_at: expiresAt,
    },
  });

  return `${refreshToken.id}.${rawToken}`;
};

const setRefreshTokenCookie = (res: any, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// PASSWORD RESET
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// EMAIL VERIFICATION
router.post('/send-verification', authenticate, resendVerificationLimiter, sendVerification);
router.post('/resend-verification', authenticate, resendVerificationLimiter, sendVerification);
router.get('/verify-email', verifyEmail);

// REGISTER
router.post(
  '/register',
  validate(registerSchema),
  async (req: any, res: any, next: any) => {
    try {
      const { email, password, role, company_name, first_name, last_name } = req.body;

      if (!email) {
        return next(new AppError('Email is required', 400));
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ 
        where: { email: String(email) } 
      });
      
      if (existingUser) return next(new AppError('User already exists', 400));

      const hashedPassword = await bcrypt.hash(password, 10);

      // Simple onboarding: Create company and user together
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: company_name },
        });

        const user = await tx.user.create({
          data: {
            email,
            password_hash: hashedPassword,
            role: role || 'ADMIN',
            company_id: company.id,
          },
        });

        const [derivedFirstName, ...derivedLastNames] = email.split('@')[0].split('.');
        const derivedLastName = derivedLastNames.length > 0 ? derivedLastNames.join(' ') : 'User';

        await tx.employee.create({
          data: {
            company_id: company.id,
            user_id: user.id,
            first_name: first_name || (derivedFirstName.charAt(0).toUpperCase() + derivedFirstName.slice(1)),
            last_name: last_name || (derivedLastName.charAt(0).toUpperCase() + derivedLastName.slice(1)),
            work_email: email,
            employee_code: 'EMP-001',
            date_of_joining: new Date(),
          }
        });

        return { user, company };
      });

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.user.id,
        companyId: result.company.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// LOGIN
router.post(
  '/login',
  validate(loginSchema),
  async (req: any, res: any, next: any) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: String(email) },
        include: { company: true, employee: true },
      });

      const bcryptMatch = user ? await bcrypt.compare(password, user.password_hash) : false;

      if (!user || !bcryptMatch) {
        await AuditService.log({
          action: AuditAction.LOGIN_FAILURE,
          entityType: 'USER',
          metadata: { email },
          ipAddress: req.ip,
        });
        return next(new AppError('Invalid credentials', 401));
      }

      if (!user.is_active) {
        return next(new AppError('User account is inactive', 403));
      }

      if (user.employee && !user.employee.is_active) {
        return next(new AppError('Employee account is inactive', 403));
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = await generateRefreshToken(user.id);

      setRefreshTokenCookie(res, refreshToken);

      await AuditService.log({
        userId: user.id,
        companyId: user.company_id || undefined,
        action: AuditAction.LOGIN_SUCCESS,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip,
      });

      // Reset rate limit on successful login
      if (req.rateLimit?.key) {
        authLimiter.resetKey(req.rateLimit.key);
      } else {
        authLimiter.resetKey(req.ip);
      }

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role,
          company: user.company,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// REFRESH TOKEN
router.post('/refresh', async (req: any, res: any, next: any) => {
  const token = req.cookies.refreshToken;

  if (!token) return next(new AppError('No refresh token provided', 401));

  try {
    const [id, rawToken] = token.split('.');
    if (!id || !rawToken) return next(new AppError('Invalid refresh token format', 401));

    const rtRecord = await prisma.refreshToken.findUnique({
      where: { id },
      include: { user: { include: { employee: true, company: true } } },
    });

    if (!rtRecord) return next(new AppError('Refresh token not found', 401));

    if (rtRecord.revoked_at) return next(new AppError('Refresh token revoked', 401));

    if (new Date() > rtRecord.expires_at) return next(new AppError('Refresh token expired', 401));

    if (hashToken(rawToken) !== rtRecord.token_hash) {
      // Potential token reuse/theft detection
      await prisma.refreshToken.update({
        where: { id },
        data: { revoked_at: new Date() },
      });
      return next(new AppError('Invalid refresh token', 401));
    }

    const { user } = rtRecord;

    if (!user.is_active) return next(new AppError('User account is inactive', 403));
    if (user.employee && !user.employee.is_active) return next(new AppError('Employee account is inactive', 403));

    // Rotate tokens
    await prisma.refreshToken.update({
      where: { id },
      data: { revoked_at: new Date() },
    });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user.id);

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
});

// LOGOUT
router.post('/logout', async (req: any, res: any, next: any) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const [id] = token.split('.');
      const rt = await prisma.refreshToken.findUnique({ where: { id } });
      
      await prisma.refreshToken.updateMany({
        where: { id },
        data: { revoked_at: new Date() },
      });

      if (rt) {
        await AuditService.log({
          userId: rt.user_id,
          action: AuditAction.LOGOUT,
          entityType: 'USER',
          entityId: rt.user_id,
          ipAddress: req.ip,
        });
      }
    } catch (err) {
      // Ignore errors during logout
    }
  }

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

// GET CURRENT USER
router.get('/me', authenticate, (req: any, res: any) => {
  res.json({ user: req.user });
});

// SET PASSWORD (via welcome token)
router.post(
  '/set-password',
  validate(setPasswordSchema),
  async (req: any, res: any, next: any) => {
    try {
      const { token, password } = req.body;

      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return next(new AppError('Invalid or expired token', 400));
      }

      if (decoded.type !== 'SET_PASSWORD') {
        return next(new AppError('Invalid token type', 400));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          password_hash: hashedPassword,
          is_active: true,
        },
      });

      res.json({ message: 'Password set successfully. You can now login.' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
