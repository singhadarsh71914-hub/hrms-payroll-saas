import { Router } from 'express';
import { authorize, AuthRequest, authenticate } from '../middleware/auth.ts';
import { AnalyticsService } from '../services/analytics.service.ts';
import { logError } from '../utils/logError.ts';
import prisma from '../lib/prisma.ts';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR', 'FINANCE'));

router.get('/kpis', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getExecutiveKPIs(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    logError('ANALYTICS_KPIS', req, err);
    next(err);
  }
});

router.get('/payroll-trends', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getPayrollTrends(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/departments', async (req: AuthRequest, res: any, next: any) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await AnalyticsService.getDepartmentCosts(req.user!.company_id!, month, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/attrition', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getAttritionMetrics(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/leave-heatmap', async (req: AuthRequest, res: any, next: any) => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const data = await AnalyticsService.getLeaveHeatmap(req.user!.company_id!, month, year);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/compliance-scorecard', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getComplianceScorecard(req.user!.company_id!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/misc-widgets', async (req: AuthRequest, res: any, next: any) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    
    const company_id = req.user!.company_id!;

    // Fetch real stats
    const active_workforce = await prisma.employee.count({
      where: { company_id, employment_status: 'ACTIVE' }
    });

    const remote_workers = await prisma.employee.count({
      where: { 
        company_id, 
        employment_status: 'ACTIVE',
        work_location: {
          contains: 'Remote',
          mode: 'insensitive'
        }
      }
    });

    const latestSnapshots = await prisma.employeeIntelligenceSnapshot.findMany({
      where: { company_id },
      orderBy: { snapshot_date: 'desc' },
      take: active_workforce || 1 // limit for performance in this widget
    });

    // Approximate trust score (average attendance score)
    let totalScore = 0;
    let count = 0;
    let critical_risks = 0;

    for (const snap of latestSnapshots) {
      if (snap.attendance_score !== null) {
        totalScore += snap.attendance_score;
        count++;
      }
      if (snap.attrition_risk === 'HIGH' || snap.burnout_risk === 'HIGH') {
        critical_risks++;
      }
    }
    const trust_score = count > 0 ? Math.round(totalScore / count) : 100;

    res.json({
      data: {
        page,
        widgets: [
          { type: 'active_workforce', title: 'Active Workforce', value: active_workforce },
          { type: 'remote_workers', title: 'Remote Workers', value: remote_workers },
          { type: 'trust_score', title: 'Avg Trust Score', value: trust_score },
          { type: 'critical_risks', title: 'Critical Risks', value: critical_risks }
        ]
      }
    });
  } catch (err) {
    console.error('Error fetching misc-widgets:', err);
    res.status(500).json({ error: 'Internal server error', data: { widgets: [] } });
  }
});

router.get('/overview', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const kpis = await AnalyticsService.getExecutiveKPIs(company_id);
    const distinctDepartments = await prisma.employee.findMany({
      where: { company_id, department_id: { not: null } },
      select: { department_id: true },
      distinct: ['department_id']
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentToday = await prisma.attendance.count({
      where: { employee: { company_id }, date: { gte: today }, status: 'PRESENT' }
    });
    const absentToday = await prisma.attendance.count({
      where: { employee: { company_id }, date: { gte: today }, status: 'ABSENT' }
    });
    const totalToday = presentToday + absentToday;
    const attendanceRate = totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 100;

    res.status(200).json({
      totalEmployees: kpis.totalEmployees,
      activeEmployees: kpis.activeEmployees,
      departments: distinctDepartments.length,
      monthlyPayroll: kpis.monthlyPayrollCost,
      attendanceRate,
      attritionRate: kpis.attritionRate
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({
      totalEmployees: 0,
      activeEmployees: 0,
      departments: 0,
      monthlyPayroll: 0,
      attendanceRate: 0,
      attritionRate: 0
    });
  }
});

router.get('/headcount', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await prisma.employee.count({
        where: {
          company_id,
          date_of_joining: { lte: endOfMonth },
          OR: [
            { employment_status: 'ACTIVE' },
            { date_of_leaving: { gt: endOfMonth } }
          ]
        }
      });
      data.push({
        month: d.toLocaleString('default', { month: 'short' }),
        employees: count
      });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(200).json([]);
  }
});

router.get('/attendance-stats', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const presentToday = await prisma.attendance.count({
      where: { employee: { company_id }, date: { gte: today }, status: 'PRESENT' }
    });
    const absentToday = await prisma.attendance.count({
      where: { employee: { company_id }, date: { gte: today }, status: 'ABSENT' }
    });

    const pendingApprovals = await prisma.leaveRequest.count({
      where: { employee: { company_id }, status: 'PENDING' }
    });

    const total = presentToday + absentToday;
    const attendanceRate = total > 0 ? Math.round((presentToday / total) * 100) : 100;

    res.status(200).json({
      presentToday,
      absentToday,
      attendanceRate,
      pendingApprovals
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({
      presentToday: 0,
      absentToday: 0,
      attendanceRate: 0,
      pendingApprovals: 0
    });
  }
});

export default router;
