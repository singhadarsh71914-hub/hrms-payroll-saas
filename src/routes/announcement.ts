import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';
import { validate } from '../middleware/validate.ts';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../schemas/announcement.schema.ts';
import { NotificationService } from '../services/notification.service.ts';

const router = Router();
router.use(authenticate);

// Get announcements
router.get('/', async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/announcements');
  try {
    const announcements = await prisma.announcement.findMany({
      where: { company_id: req.user!.company_id! },
      orderBy: { created_at: 'desc' }
    });
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// Create announcement
router.post('/', authorize('ADMIN', 'HR'), validate(createAnnouncementSchema), async (req: AuthRequest, res: any, next: any) => {
  console.log('POST /api/announcements');
  try {
    const { title, content, priority } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        company_id: req.user!.company_id!,
        title,
        content,
        priority: priority || 'NORMAL',
        created_by: req.user!.id
      }
    });

    const activeUsers = await prisma.user.findMany({ 
      where: { company_id: req.user!.company_id!, is_active: true }
    });

    const notifications = activeUsers.map(u => ({
      user_id: u.id,
      type: 'ANNOUNCEMENT_PUBLISHED',
      title: 'New Announcement',
      message: `${title}`,
    }));

    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(req.user!.company_id!, notifications);
    }

    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

// Update announcement
router.put('/:id', authorize('ADMIN', 'HR'), validate(updateAnnouncementSchema), async (req: AuthRequest, res: any, next: any) => {
  console.log(`PUT /api/announcements/${req.params.id}`);
  try {
    const { title, content, priority } = req.body;
    const announcement = await prisma.announcement.update({
      // @ts-ignore
      where: { id: req.params.id },
      data: { title, content, priority }
    });
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

// Delete announcement
router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`DELETE /api/announcements/${req.params.id}`);
  try {
    // @ts-ignore
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
