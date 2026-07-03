import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR'));

// GET /api/audit-logs
router.get('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      action, 
      entityType,
      page = 1,
      limit = 20
    } = req.query;

    // Fetch all users in the company
    const companyUsers = await prisma.user.findMany({
      where: { company_id: req.user!.company_id as string },
      select: { id: true, email: true, role: true }
    });
    
    const companyUserIds = companyUsers.map(u => u.id);

    const where: any = {
      OR: [
        { user_id: { in: companyUserIds } },
        { user_id: null }
      ]
    };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate as string);
      if (endDate) where.created_at.lte = new Date(endDate as string);
    }

    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Manually map the user data since there is no Prisma relation
    const logsWithUser = logs.map(log => {
      const userObj = companyUsers.find(u => u.id === log.user_id);
      return {
        ...log,
        user: userObj || null
      };
    });

    res.json({
      logs: logsWithUser,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
