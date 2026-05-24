import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.ts';
import { DashboardService } from '../services/dashboard.service.ts';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user?.company_id as string;
    const stats = await DashboardService.getStats(companyId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
