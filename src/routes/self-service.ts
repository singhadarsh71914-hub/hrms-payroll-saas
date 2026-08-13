import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { LeaveService } from '../services/leave.service.ts';
import { PayrollService } from '../services/payroll.service.ts';
import { validate } from '../middleware/validate.ts';
import { createLeaveSchema } from '../schemas/leave.schema.ts';

const router = Router();

router.use(authenticate);

// Verify employee access
const verifyEmployee = (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.employee_id) {
    return next(new AppError('No employee profile associated with this user', 403));
  }
  next();
};

router.use(verifyEmployee);

// DASHBOARD STATS
router.get('/dashboard', async (req: AuthRequest, res: any, next: any) => {
  try {
    console.log({
      route: '/api/self-service/dashboard',
      userId: req.user?.id,
      companyId: req.user?.company_id,
      success: 'PENDING'
    });

    const employeeId = req.user!.employee_id!;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [balances, latestPayslip, attendance, employee] = await Promise.all([
      LeaveService.getLeaveBalances(employeeId, currentYear),
      prisma.payslip.findFirst({
        where: { employee_id: employeeId, status: 'FINALIZED' },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.attendance.findMany({
        where: {
          employee_id: employeeId,
          date: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lte: new Date(currentYear, currentMonth, 0),
          },
        },
      }),
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: { first_name: true, last_name: true, face_enrolled_at: true, face_descriptor: true, biometric_enabled: true }
      })
    ]);

    const attendanceSummary = {
      PRESENT: attendance.filter(a => a.status === 'PRESENT').length,
      ABSENT: attendance.filter(a => a.status === 'ABSENT').length,
      HALF_DAY: attendance.filter(a => a.status === 'HALF_DAY').length,
      ON_LEAVE: attendance.filter(a => a.status === 'ON_LEAVE').length,
    };

    res.json({
      employee,
      leaveBalances: balances,
      latestPayslip,
      attendanceSummary,
    });
    console.log({
      route: '/api/self-service/dashboard',
      userId: req.user?.id,
      companyId: req.user?.company_id,
      success: true
    });
  } catch (err) {
    console.log({
      route: '/api/self-service/dashboard',
      userId: req.user?.id,
      companyId: req.user?.company_id,
      success: false,
      error: err
    });
    next(err);
  }
});

// PAYSLIPS LIST
router.get('/payslips', async (req: AuthRequest, res: any, next: any) => {
  try {
    const payslips = await prisma.payslip.findMany({
      where: { employee_id: req.user!.employee_id!, status: 'FINALIZED' },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(payslips);
  } catch (err) {
    next(err);
  }
});

// DOWNLOAD PAYSLIP
router.get('/payslips/:id/download', async (req: AuthRequest, res: any, next: any) => {
  try {
    const payslip = await prisma.payslip.findFirst({
      // @ts-ignore
      where: { id: req.params.id },
      include: { payroll_run: true }
    });

    if (!payslip) return next(new AppError('Payslip not found', 404));

    const runId = payslip.payroll_run_id;
    const employeeId = payslip.employee_id;

    // --- AUTHORIZATION CHECKS ---
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      // @ts-ignore
      select: { company_id: true, reporting_manager_id: true }
    });

    if (!targetEmployee) return next(new AppError('Employee not found', 404));

    const user = req.user!;
    if (targetEmployee.company_id !== user.company_id) return next(new AppError('Access denied', 403));

    if (user.role === 'EMPLOYEE' && user.employee_id !== employeeId) return next(new AppError('Access denied', 403));

    if (user.role === 'MANAGER' && user.employee_id !== employeeId && targetEmployee.reporting_manager_id !== user.employee_id) return next(new AppError('Access denied', 403));

    // @ts-ignore
    if (payslip.payroll_run.company_id !== user.company_id) return next(new AppError('Access denied', 403));
    // ----------------------------

    const doc = await PayrollService.generatePayslipPDF(runId, employeeId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payslip.month}_${payslip.year}.pdf`);
    
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
});

// LEAVE REQUESTS
router.get('/leaves', async (req: AuthRequest, res: any, next: any) => {
  try {
    const leaves = await LeaveService.getLeaveRequests(req.user!.company_id!, req.user!.employee_id!);
    res.json(leaves);
  } catch (err) {
    next(err);
  }
});

// APPLY LEAVE
router.post('/leaves', validate(createLeaveSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const leave = await LeaveService.applyLeave(req.user!.employee_id!, req.body);
    res.json(leave);
  } catch (err) {
    next(err);
  }
});

export default router;
