import { Request, Response } from 'express';
import crypto from 'crypto';
// @ts-ignore
import prisma from '../lib/prisma';
// @ts-ignore
import { emailService } from '../services/email.service';
// @ts-ignore
import { logger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';
export const resendVerificationLimiter = rateLimit({
  windowMs: isDev ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min in dev, 15 min in prod
  limit: isDev ? 100 : 3, // 100 requests in dev, 3 per 15 min in prod
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { 
    code: 'RATE_LIMITED',
    message: 'Please wait before requesting another email. Try again later.' 
  }
});

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const sendVerification = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ code: 'EMAIL_ALREADY_VERIFIED', message: 'Your email is already verified.' });
    }

    // Check if token exists and is still valid
    if (user.email_verification_token && user.email_verification_expires_at && user.email_verification_expires_at > new Date()) {
      return res.status(400).json({ code: 'RATE_LIMITED', message: 'A verification link has already been sent recently. Please check your inbox.' });
    }

    const rawToken = generateVerificationToken();
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        email_verification_token: hashedToken,
        email_verification_expires_at: expiresAt
      }
    });

    try {
      await emailService.sendEmailVerification(user.email, rawToken);
    } catch (smtpError) {
      logger.error(`SMTP Error: ${smtpError}`);
      return res.status(503).json({ code: 'SMTP_UNAVAILABLE', message: 'Email service is temporarily unavailable.' });
    }

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'EMAIL_VERIFICATION_SENT',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip || req.socket.remoteAddress || 'unknown',
        metadata: { agent: req.headers['user-agent'] }
      }
    });

    return res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    logger.error(`Send verification error: ${error}`);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error.' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Valid token is required' });
    }

    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        email_verification_token: hashedToken
      }
    });

    logger.info({
      tokenReceived: token?.slice(0, 8),
      tokenHashGenerated: hashedToken.slice(0, 8),
      userFound: !!user,
      expired: user && user.email_verification_expires_at ? user.email_verification_expires_at < new Date() : true
    });

    if (!user || (user.email_verification_expires_at && user.email_verification_expires_at < new Date())) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/verify-email?status=error`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        email_verification_token: null,
        email_verification_expires_at: null
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'EMAIL_VERIFIED',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip || req.socket.remoteAddress || 'unknown',
        metadata: { agent: req.headers['user-agent'] }
      }
    });

    logger.info(`User ${user.id} successfully verified email`);

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/verify-email?status=success`);

  } catch (error) {
    logger.error(`Verify email error: ${error}`);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/verify-email?status=error`);
  }
};
