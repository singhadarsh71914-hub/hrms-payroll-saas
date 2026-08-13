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

// Alias: client calls '/payroll-trend' (singular), backend has '/payroll-trends' (plural)
router.get('/payroll-trend', async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = await AnalyticsService.getPayrollTrends(req.user!.company_id!);
    res.json(data);
  } catch (err) {
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

// top-employees: employees with highest gross salary this month
router.get('/top-employees', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const now = new Date();
    const rows: any[] = await prisma.$queryRaw`
      SELECT e.id, e.first_name, e.last_name, e.employee_id as emp_code,
             d.name as department, ps.gross_salary
      FROM "Payslip" ps
      JOIN "Employee" e ON ps.employee_id = e.id
      LEFT JOIN "Department" d ON e.department_id = d.id
      JOIN "PayrollRun" pr ON ps.payroll_run_id = pr.id
      WHERE pr.company_id = ${company_id}
        AND pr.month = ${now.getMonth() + 1}
        AND pr.year = ${now.getFullYear()}
        AND pr.status IN ('PROCESSED','APPROVED','PAID')
      ORDER BY ps.gross_salary DESC
      LIMIT 5
    `;
    res.json(rows.map((r: any) => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      department: r.department || 'Unassigned',
      salary: Number(r.gross_salary)
    })));
  } catch (err) {
    res.json([]);
  }
});

// leave-stats
router.get('/leave-stats', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const pending = await prisma.leaveRequest.count({ where: { employee: { company_id }, status: 'PENDING' } });
    const approved = await prisma.leaveRequest.count({ where: { employee: { company_id }, status: 'APPROVED' } });
    const rejected = await prisma.leaveRequest.count({ where: { employee: { company_id }, status: 'REJECTED' } });
    res.json({ pending, approved, rejected, total: pending + approved + rejected });
  } catch (err) { res.json({ pending: 0, approved: 0, rejected: 0, total: 0 }); }
});

// department-stats
router.get('/department-stats', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const rows: any[] = await prisma.$queryRaw`
      SELECT d.name, COUNT(e.id)::int as count
      FROM "Employee" e JOIN "Department" d ON e.department_id = d.id
      WHERE e.company_id = ${company_id} AND e.employment_status = 'ACTIVE'
      GROUP BY d.name ORDER BY count DESC
    `;
    res.json(rows.map((r: any) => ({ name: r.name, count: Number(r.count) })));
  } catch (err) { res.json([]); }
});

// loan-stats
router.get('/loan-stats', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const pending = await prisma.loan.count({ where: { employee: { company_id }, status: 'PENDING' } });
    const approved = await prisma.loan.count({ where: { employee: { company_id }, status: 'APPROVED' } });
    const total = await prisma.loan.aggregate({ where: { employee: { company_id } }, _sum: { principal_amount: true } });
    res.json({ pending, approved, totalAmount: Number(total._sum.principal_amount || 0) });
  } catch (err) { res.json({ pending: 0, approved: 0, totalAmount: 0 }); }
});

// tds-trend — use total_deductions as a proxy since PayrollRun has no dedicated TDS field
router.get('/tds-trend', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const runs = await prisma.payrollRun.findMany({
      where: { company_id, status: { in: ['PROCESSED', 'APPROVED', 'PAID'] } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
      select: { month: true, year: true, total_deductions: true }
    });
    res.json(runs.reverse().map(r => ({
      period: `${r.year}-${String(r.month).padStart(2, '0')}`,
      tds: Number(r.total_deductions || 0)
    })));
  } catch (err) { res.json([]); }
});

// leave-utilization
router.get('/leave-utilization', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const leaves = await prisma.leaveRequest.aggregate({
      where: { employee: { company_id }, start_date: { gte: sixMonthsAgo }, status: 'APPROVED' },
      _sum: { total_days: true }
    });
    const active = await prisma.employee.count({ where: { company_id, employment_status: 'ACTIVE' } });
    const totalWorkingDays = active * 180;
    const utilization = totalWorkingDays > 0 ? Number(((Number(leaves._sum.total_days || 0) / totalWorkingDays) * 100).toFixed(2)) : 0;
    res.json({ utilizationRate: utilization, totalDaysUsed: Number(leaves._sum.total_days || 0) });
  } catch (err) { res.json({ utilizationRate: 0, totalDaysUsed: 0 }); }
});

// export: basic CSV/JSON report
router.get('/export', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const [overview, headcount] = await Promise.all([
      AnalyticsService.getExecutiveKPIs(company_id),
      prisma.employee.count({ where: { company_id, employment_status: 'ACTIVE' } })
    ]);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="report.xlsx"`);
    // Return JSON as mock — full Excel support requires exceljs
    res.status(200).json({ exported: true, data: { overview, headcount } });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
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

router.get('/misc-widgets', async (req: AuthRequest, res: any) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ error: 'Invalid page parameter' });
    }

    const company_id = req.user!.company_id!;

    // Active workforce count
    const active_workforce = await prisma.employee.count({
      where: { company_id, employment_status: 'ACTIVE' }
    });

    // Remote workers (employees whose work_location contains 'remote')
    const remote_workers = await prisma.employee.count({
      where: {
        company_id,
        employment_status: 'ACTIVE',
        work_location: { contains: 'Remote', mode: 'insensitive' }
      }
    });

    // Intelligence snapshots for risk scoring
    const latestSnapshots = await prisma.employeeIntelligenceSnapshot.findMany({
      where: { company_id },
      orderBy: { snapshot_date: 'desc' },
      take: active_workforce || 1
    });

    let totalScore = 0;
    let scoreCount = 0;
    let critical_risks = 0;
    for (const snap of latestSnapshots) {
      if (snap.attendance_score !== null) {
        totalScore += snap.attendance_score;
        scoreCount++;
      }
      if (snap.attrition_risk === 'HIGH' || snap.burnout_risk === 'HIGH') {
        critical_risks++;
      }
    }
    const trust_score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 100;

    // Department distribution — real groupBy via raw query for efficiency
    const deptRows: any[] = await prisma.$queryRaw`
      SELECT d.name, COUNT(e.id)::int as count
      FROM "Employee" e
      JOIN "Department" d ON e.department_id = d.id
      WHERE e.company_id = ${company_id} AND e.employment_status = 'ACTIVE'
      GROUP BY d.name
      ORDER BY count DESC
    `;
    const departmentDistribution = deptRows.map((r: any) => ({
      name: r.name,
      count: Number(r.count)
    }));

    // Birthdays this month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const birthdayEmployees = await prisma.employee.findMany({
      where: {
        company_id,
        employment_status: 'ACTIVE',
        date_of_birth: { not: null }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        date_of_birth: true,
        department: { select: { name: true } }
      }
    });
    const birthdays = birthdayEmployees
      .filter((e: any) => e.date_of_birth && new Date(e.date_of_birth).getMonth() + 1 === currentMonth)
      .map((e: any) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        date: e.date_of_birth,
        department: e.department?.name || ''
      }));

    res.json({
      data: {
        page,
        widgets: [
          { type: 'active_workforce', title: 'Active Workforce', value: active_workforce },
          { type: 'remote_workers', title: 'Remote Workers', value: remote_workers },
          { type: 'trust_score', title: 'Avg Trust Score', value: trust_score },
          { type: 'critical_risks', title: 'Critical Risks', value: critical_risks }
        ],
        departmentDistribution,
        birthdays
      }
    });
  } catch (err) {
    console.error('Error fetching misc-widgets:', err);
    res.status(500).json({ error: 'Internal server error', data: { widgets: [], departmentDistribution: [], birthdays: [] } });
  }
});

router.get('/overview', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const kpis = await AnalyticsService.getExecutiveKPIs(company_id);

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

    const pendingLeaves = await prisma.leaveRequest.count({
      where: { employee: { company_id }, status: 'PENDING' }
    });
    const pendingLoans = await prisma.loan.count({
      where: { employee: { company_id }, status: 'PENDING' }
    });

    // currentPayrollCost is what Dashboard & Analytics read
    res.status(200).json({
      totalEmployees: kpis.totalEmployees,
      activeEmployees: kpis.activeEmployees,
      currentPayrollCost: kpis.monthlyPayrollCost,
      attendanceRate,
      attritionRate: kpis.attritionRate,
      pendingLeaves,
      pendingLoans,
      trends: kpis.trends
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({
      totalEmployees: 0,
      activeEmployees: 0,
      currentPayrollCost: 0,
      attendanceRate: 0,
      attritionRate: 0,
      pendingLeaves: 0,
      pendingLoans: 0,
      trends: { hires: 0, exits: 0 }
    });
  }
});

router.get('/headcount', async (req: AuthRequest, res: any) => {
  try {
    const company_id = req.user!.company_id!;
    const now = new Date();
    const rangeParam = (req.query.range as string) || '6m';
    const months = rangeParam === '3m' ? 3 : rangeParam === '1y' ? 12 : 6;
    const data = [];
    const earliestEmp = await prisma.employee.findFirst({
      where: { company_id },
      orderBy: { date_of_joining: 'asc' },
      select: { date_of_joining: true }
    });
    
    const earliestMonth = earliestEmp?.date_of_joining 
      ? new Date(earliestEmp.date_of_joining.getFullYear(), earliestEmp.date_of_joining.getMonth(), 1) 
      : new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      if (d < earliestMonth && d.getTime() !== earliestMonth.getTime()) {
        continue;
      }

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
      // Use 'name' and 'count' to match frontend chart dataKeys
      data.push({
        name: d.toLocaleString('default', { month: 'short' }),
        count,
        month: d.toLocaleString('default', { month: 'short' }) // also expose 'month' for tooltip
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
