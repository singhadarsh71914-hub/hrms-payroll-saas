import { Request, Response } from 'express';
// @ts-ignore
import prisma from '../lib/prisma';
// @ts-ignore
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { ZipArchive } from 'archiver';

export const exportAccountData = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch all user-related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            attendance: true,
            salaries: true,
            leave_requests: true,
            leave_balances: true,
            documents: true,
            loans: true,
            reimbursements: true,
            performance_reviews: true,
          }
        }
      }
    });

    const audit_logs = await prisma.auditLog.findMany({ where: { user_id: userId } });
    const notifications = await prisma.notification.findMany({ where: { user_id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the export action
    await prisma.auditLog.create({
      data: {
        user_id: user.id,
        action: 'DATA_EXPORT_REQUESTED',
        entity_type: 'User',
        entity_id: user.id,
        ip_address: req.ip || req.socket.remoteAddress || 'unknown',
        metadata: { agent: req.headers['user-agent'] }
      }
    });

    // Create a zip file response
    res.attachment(`account_export_${user.email}_${new Date().toISOString().split('T')[0]}.zip`);
    const archive = new ZipArchive({
      zlib: { level: 9 } // Sets the compression level.
    });

    // @ts-ignore
    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);

    // Filter out sensitive auth info before sending
    const safeUser = { ...user };
    delete (safeUser as any).password_hash;
    delete (safeUser as any).email_verification_token;
    delete (safeUser as any).reset_password_token;
    
    (safeUser as any).audit_logs = audit_logs;
    (safeUser as any).notifications = notifications;

    // Append JSON data
    archive.append(JSON.stringify(safeUser, null, 2), { name: 'profile_and_history.json' });

    // Helper to generate CSV strings
    const toCSV = (data: any[]) => {
      if (!data || data.length === 0) return '';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => 
          `"${String(val).replace(/"/g, '""')}"`
        ).join(',')
      );
      return [headers, ...rows].join('\n');
    };

    // Append CSVs
    if (user.employee) {
      archive.append(toCSV(user.employee.attendance), { name: 'attendance.csv' });
      archive.append(toCSV(user.employee.leave_requests), { name: 'leaves.csv' });
      archive.append(toCSV(user.employee.salaries), { name: 'payroll.csv' });
    }
    archive.append(toCSV(audit_logs), { name: 'audit_logs.csv' });

    await archive.finalize();

  } catch (error) {
    logger.error(`Account export error: ${error}`);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to export account data' });
    }
  }
};

export const deleteAccount = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password confirmation is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Log failed deletion attempt
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'ACCOUNT_DELETION_FAILED',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: { reason: 'Invalid password' }
        }
      });
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Determine retention (30 days)
    const deletionDate = new Date();
    const scheduledPurgeDate = new Date();
    scheduledPurgeDate.setDate(scheduledPurgeDate.getDate() + 30); // 30-day retention window

    // Perform soft deletion using transaction
    // @ts-ignore
    await prisma.$transaction(async (tx) => {
      // 1. Soft delete User
      await tx.user.update({
        where: { id: userId },
        data: {
          is_active: false,
          scheduled_purge_at: scheduledPurgeDate
        }
      });

      // 2. Soft delete Employee (if exists)
      if (user.employee) {
        await tx.employee.update({
          where: { id: user.employee.id },
          data: {
            is_active: false,
            deleted_at: deletionDate
          }
        });
      }

      // 3. Invalidate all sessions
      await tx.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() }
      });

      // 4. Audit the soft deletion
      await tx.auditLog.create({
        data: {
          user_id: user.id,
          action: 'ACCOUNT_SOFT_DELETED',
          entity_type: 'User',
          entity_id: user.id,
          ip_address: req.ip || req.socket.remoteAddress || 'unknown',
          metadata: { scheduled_purge_at: scheduledPurgeDate }
        }
      });
    });

    // Logout via clearing cookie (this is optional as token is revoked, but good practice)
    res.clearCookie('refreshToken');

    logger.info(`User ${userId} soft-deleted account. Purge scheduled for ${scheduledPurgeDate}`);
    return res.status(200).json({ 
      message: 'Account scheduled for deletion. You have a 30-day grace period to restore your account before permanent deletion.' 
    });

  } catch (error) {
    logger.error(`Account deletion error: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
