import { Router } from 'express';
import { authenticate } from '../middleware/auth.ts';
import { NotificationService } from '../services/notification.service.ts';
import { z } from 'zod';

const router = Router();

// Validation schemas
const paginationSchema = z.object({
  skip: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  take: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
});

router.use(authenticate);

// GET /api/notifications/stream
router.get('/stream', (req: any, res: any) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE

  const userId = req.user.id;
  
  // Listener for events
  const listener = (notification: any) => {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  };

  import('../services/notification.service.ts').then(({ notificationEmitter }) => {
    notificationEmitter.on(`notify:${userId}`, listener);

    // Send an initial heartbeat
    res.write('data: {"type": "CONNECTED"}\n\n');

    // Keep connection alive with heartbeat every 30s
    const heartbeat = setInterval(() => {
      res.write('data: {"type": "HEARTBEAT"}\n\n');
    }, 30000);

    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      notificationEmitter.off(`notify:${userId}`, listener);
      res.end();
    });
  });
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req: any, res: any, next: any) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.company_id, req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { skip, take } = paginationSchema.parse(req.query);
    const result = await NotificationService.getNotifications(req.user.company_id, req.user.id, { skip, take });
    res.json({ success: true, data: result.notifications, total: result.total });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/mark-all-read
// We also support PATCH as verified by issues check
router.put('/mark-all-read', async (req: any, res: any, next: any) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.company_id, req.user.id);
    res.json({ success: true, message: 'All notifications marked as read', updatedCount: result.count });
  } catch (error: any) {
    console.error("===== NOTIFICATION ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    console.error("USER:", req.user);
    console.error("BODY:", req.body);
    console.error("TYPE:", error?.constructor?.name);
    console.error(error);
    if (error?.stack) {
      console.error(error.stack);
    }
    next(error);
  }
});

router.patch('/mark-all-read', async (req: any, res: any, next: any) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.company_id, req.user.id);
    res.json({ success: true, message: 'All notifications marked as read', updatedCount: result.count });
  } catch (error: any) {
    console.error("===== NOTIFICATION ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    console.error("USER:", req.user);
    console.error("BODY:", req.body);
    console.error("TYPE:", error?.constructor?.name);
    console.error(error);
    if (error?.stack) {
      console.error(error.stack);
    }
    next(error);
  }
});

// POST /api/notifications/read
router.post('/read', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Notification ID is required' });
    const result = await NotificationService.markAsRead(req.user.company_id, req.user.id, id);
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error("===== NOTIFICATION ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    console.error("USER:", req.user);
    console.error("BODY:", req.body);
    console.error("TYPE:", error?.constructor?.name);
    console.error(error);
    if (error?.stack) {
      console.error(error.stack);
    }
    next(error);
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req: any, res: any, next: any) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.company_id, req.user.id);
    res.json({ success: true, message: 'All notifications marked as read', updatedCount: result.count });
  } catch (error: any) {
    console.error("===== NOTIFICATION ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    console.error("USER:", req.user);
    console.error("BODY:", req.body);
    console.error("TYPE:", error?.constructor?.name);
    console.error(error);
    if (error?.stack) {
      console.error(error.stack);
    }
    next(error);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const result = await NotificationService.markAsRead(req.user.company_id, req.user.id, id);
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error("===== NOTIFICATION ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    console.error("USER:", req.user);
    console.error("BODY:", req.body);
    console.error("TYPE:", error?.constructor?.name);
    console.error(error);
    if (error?.stack) {
      console.error(error.stack);
    }
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const result = await NotificationService.deleteNotification(req.user.company_id, req.user.id, id);
    if (result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
