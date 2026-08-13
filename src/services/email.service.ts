import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.ts';

export interface EmailProvider {
  sendPasswordReset(email: string, resetToken: string): Promise<void>;
  sendEmailVerification(email: string, verificationToken: string): Promise<void>;
}

export class SmtpEmailService implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

    if (SMTP_HOST && EMAIL_USER && EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });
      this.isConfigured = true;
      logger.info('SMTP Email Service initialized');
    } else {
      logger.warn('SMTP credentials missing. Email Service is operating in BLOCKED/UNVERIFIED mode.');
    }
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      logger.error('Cannot send password reset email: SMTP not configured');
      return; // Do NOT fake email delivery per strict instructions
    }

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      logger.error('FRONTEND_URL environment variable is not set. Cannot generate reset link.');
      throw new Error('FRONTEND_URL is not configured');
    }
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"HRMS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetLink} \n\nIf you did not request this, please ignore this email. This link will expire in 30 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your HRMS account.</p>
          <p>Click the button below to reset your password. This link will expire in 30 minutes.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}: ${error}`);
      throw new Error('Failed to send email');
    }
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      logger.error('Cannot send verification email: SMTP not configured');
      return;
    }

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: `"HRMS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email address',
      text: `Please verify your email address by clicking the following link: ${verifyLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Please verify your email address by clicking the button below.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563EB; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}: ${error}`);
      throw new Error('Failed to send email');
    }
  }
}

export const emailService = new SmtpEmailService();
