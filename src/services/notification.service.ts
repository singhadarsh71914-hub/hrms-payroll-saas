import prisma from '../lib/prisma.ts';
import { getIO, isSocketReady } from '../socket.ts';
import { EventEmitter } from 'events';

export const notificationEmitter = new EventEmitter();
// Increase max listeners if many connections
notificationEmitter.setMaxListeners(0);

export class NotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(data: {
    company_id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }) {
    const notification = await prisma.notification.create({
      data: {
        company_id: data.company_id,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || null,
      },
    });
    notificationEmitter.emit(`notify:${data.user_id}`, notification);
    
    if (isSocketReady()) {
      try {
        getIO().to(`user:${data.user_id}`).emit('notification:new', notification);
      } catch (err) {
        console.error('Socket emit error:', err);
      }
    }
    
    return notification;
  }

  /**
   * Create bulk notifications
   */
  static async createBulkNotifications(
    company_id: string,
    notifications: {
      user_id: string;
      type: string;
      title: string;
      message: string;
      metadata?: any;
    }[]
  ) {
    const data = notifications.map(n => ({
      company_id,
      user_id: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata || null,
    }));

    // In Prisma, createMany doesn't return the inserted records.
    // We can just emit a generic 'refresh' signal to all affected users.
    const result = await prisma.notification.createMany({
      data,
    });
    
    const uniqueUsers = [...new Set(notifications.map(n => n.user_id))];
    uniqueUsers.forEach(userId => {
      notificationEmitter.emit(`notify:${userId}`, { type: 'REFRESH_REQUIRED' });
      if (isSocketReady()) {
        try {
          getIO().to(`user:${userId}`).emit('notification:new', { type: 'REFRESH_REQUIRED' });
        } catch (err) {
          console.error('Socket emit error:', err);
        }
      }
    });
    
    return result;
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getNotifications(
    company_id: string,
    user_id: string,
    options: { skip?: number; take?: number } = { skip: 0, take: 20 }
  ) {
    const notifications = await prisma.notification.findMany({
      where: {
        company_id,
        user_id,
      },
      orderBy: {
        created_at: 'desc',
      },
      skip: options.skip,
      take: options.take,
    });

    const total = await prisma.notification.count({
      where: {
        company_id,
        user_id,
      },
    });

    return { notifications, total };
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(company_id: string, user_id: string, notification_id: string) {
    // We enforce company_id and user_id to ensure no cross-tenant or cross-user access
    return await prisma.notification.updateMany({
      where: {
        id: notification_id,
        company_id,
        user_id,
      },
      data: {
        is_read: true,
      },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(company_id: string, user_id: string) {
    return await prisma.notification.updateMany({
      where: {
        company_id,
        user_id,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(company_id: string, user_id: string) {
    return await prisma.notification.count({
      where: {
        company_id,
        user_id,
        is_read: false,
      },
    });
  }

  /**
   * Delete old notifications (e.g., older than 30 days)
   */
  static async deleteOldNotifications(company_id: string, daysOld: number = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysOld);

    return await prisma.notification.deleteMany({
      where: {
        company_id,
        created_at: {
          lt: dateLimit,
        },
      },
    });
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(company_id: string, user_id: string, notification_id: string) {
    return await prisma.notification.deleteMany({
      where: {
        id: notification_id,
        company_id,
        user_id,
      },
    });
  }
}
