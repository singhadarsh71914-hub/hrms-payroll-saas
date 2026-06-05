import { Router } from 'express';
import { authorize, AuthRequest, authenticate } from '../middleware/auth.ts';
import { AnalyticsService } from '../services/analytics.service.ts';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR'));

router.get('/overview', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getOverview(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/payroll-trend', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getPayrollTrend(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/headcount', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getHeadcountTrend(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/leave-stats', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getLeaveStats(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/attendance-stats', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getAttendanceStats(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/department-stats', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getDepartmentStats(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/loan-stats', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getLoanStats(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/tds-trend', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getTDSTrend(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/leave-utilization', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getLeaveUtilization(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/top-employees', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getTopEmployees(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/misc-widgets', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getMiscWidgets(req.user!.company_id!, req.query.range as string);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req: AuthRequest, res: any, next: any) => {
  try {
    const buffer = await AnalyticsService.generateExcelReport(req.user!.company_id!, req.query.range as string);
    const month = new Date().toLocaleString('default', { month: 'short' });
    const year = new Date().getFullYear();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=HRMS_Report_${month}_${year}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
});

export default router;
