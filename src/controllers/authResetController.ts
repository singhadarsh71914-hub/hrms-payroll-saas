import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
// @ts-ignore
import prisma from '../lib/prisma';
// @ts-ignore
import { emailService } from '../services/email.service';
// @ts-ignore
import { logger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';

// Rate Limiter for Forgot Password (prevent enumeration/spam)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3, // Limit each IP to 3 requests per windowMs
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' }
});

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Always use a constant time operation wrapper if possible. We simulate constant time by always returning success.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (user && user.is_active) {
      // 1. Generate secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // 2. Hash token for storage
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // 3. Set expiry (30 minutes)
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // 4. Update user in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          reset_password_token: hashedToken,
          reset_password_expires_at: expiresAt,
          password_reset_requested_at: new Date(),
        }
      });

      // 5. Send email (will exit early if no SMTP per rules)
      await emailService.sendPasswordReset(user.email, resetToken);

      // 6. Audit Log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          company_id: user.company_id,
          action: 'PASSWORD_RESET_REQUESTED',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: { agent: req.headers['user-agent'] }
        }
      });
    }

    // Always return 200 OK regardless of whether email exists to prevent enumeration
    return res.status(200).json({ 
      message: 'If an account with that email exists, we have sent a password reset link.' 
    });

  } catch (error) {
    logger.error(`Forgot password error: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // 1. Hash the incoming token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find user with valid token and not expired
    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: hashedToken,
        reset_password_expires_at: {
          gt: new Date() // Token must not be expired
        },
        is_active: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // 4. Update user, clear tokens, enforce single-use
    // @ts-ignore
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password_hash: passwordHash,
          reset_password_token: null,
          reset_password_expires_at: null,
        }
      });

      // 5. Invalidate all active sessions (refresh tokens)
      await tx.refreshToken.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: new Date() }
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          company_id: user.company_id,
          action: 'PASSWORD_RESET_COMPLETED',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: { agent: req.headers['user-agent'] }
        }
      });
    });

    logger.info(`User ${user.id} successfully reset password`);

    return res.status(200).json({ message: 'Password has been successfully reset' });

  } catch (error) {
    logger.error(`Reset password error: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
