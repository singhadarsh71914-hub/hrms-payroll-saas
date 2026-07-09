import { Router } from 'express';
import { authorize, AuthRequest, authenticate } from '../middleware/auth.ts';
import { ReportService } from '../services/report.service.ts';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR', 'FINANCE'));

router.post('/executive', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await ReportService.queueExecutiveReport(req.user!.company_id!, req.body.format || 'pdf', req.body.recipients);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/payroll', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await ReportService.queuePayrollReport(req.user!.company_id!, req.body.format || 'csv', req.body.recipients);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/department', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await ReportService.queueDepartmentReport(req.user!.company_id!, req.body.format || 'csv', req.body.recipients);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/scheduled', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await ReportService.getScheduledReports(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/scheduled', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await ReportService.scheduleReport(req.user!.company_id!, req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
