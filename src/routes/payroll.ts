import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { PayrollService } from '../services/payroll.service.ts';
import { AuditService, AuditAction } from '../services/audit.service.ts';
import { validate } from '../middleware/validate.ts';
import { runPayrollSchema } from '../schemas/payroll.schema.ts';
import prisma from '../lib/prisma.ts';

const router = Router();
router.use(authenticate);

router.get('/:runId/payslip/:employeeId', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { runId, employeeId } = req.params;
    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId as string },
      select: { company_id: true, reporting_manager_id: true }
    });
    if (!targetEmployee) return next(new AppError('Employee not found', 404));

    const user = req.user!;
    if (targetEmployee.company_id !== user.company_id) return next(new AppError('Access denied', 403));
    if (user.role === 'EMPLOYEE' && user.employee_id !== employeeId) return next(new AppError('Access denied', 403));
    if (user.role === 'MANAGER' && user.employee_id !== employeeId && targetEmployee.reporting_manager_id !== user.employee_id) return next(new AppError('Access denied', 403));

    const targetRun = await prisma.payrollRun.findUnique({ where: { id: runId as string }, select: { company_id: true } });
    if (!targetRun || targetRun.company_id !== user.company_id) return next(new AppError('Access denied', 403));

    const payslipExists = await prisma.payslip.findFirst({ where: { payroll_run_id: runId as string, employee_id: employeeId as string } });
    if (!payslipExists) return next(new AppError('Payslip not found', 404));

    const doc = await PayrollService.generatePayslipPDF(runId as string, employeeId as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', "attachment; filename=payslip_$employeeId.pdf");
    doc.pipe(res);
  } catch (err) { next(err); }
});

router.post('/run', authorize('ADMIN', 'HR'), validate(runPayrollSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const { month, year } = req.body;
    const companyId = req.user?.company_id as string;
    const result = await PayrollService.processPayroll(companyId, month, year);
    await AuditService.log({
      userId: req.user?.id, companyId, action: AuditAction.PAYROLL_GENERATE,
      entityType: 'PAYROLL_RUN', entityId: result.id, metadata: { month, year }, ipAddress: req.ip,
    });
    res.status(201).json(result);
  } catch (err: any) { next(new AppError(err.message, 400)); }
});

router.get('/runs', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try { res.json(await PayrollService.getPayrollRuns(req.user?.company_id as string)); } catch (err) { next(err); }
});

router.get('/runs/:id/payslips', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try { res.json(await PayrollService.getPayslipsForRun(req.params.id as string)); } catch (err) { next(err); }
});

router.put('/runs/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const run = await prisma.payrollRun.findUnique({ where: { id: req.params.id as string } });
    if (!run) return next(new AppError('Not found', 404));
    
    const oldStatus = run.status;
    const newStatus = req.body.status;

    if (newStatus && oldStatus !== newStatus) {
      // DRAFT -> PROCESSING
      // PROCESSING -> COMPLETED
      // PROCESSING -> CANCELLED
      // COMPLETED -> LOCKED
      const validTransitions: Record<string, string[]> = {
        'DRAFT': ['PROCESSING'],
        'PROCESSING': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': ['LOCKED'],
        'CANCELLED': [],
        'LOCKED': []
      };
      
      const allowed = validTransitions[oldStatus] || [];
      if (!allowed.includes(newStatus)) {
        return next(new AppError(`Invalid status transition from ${oldStatus} to ${newStatus}`, 400));
      }
    } else if (oldStatus === 'COMPLETED' || oldStatus === 'LOCKED') {
      return next(new AppError('Completed payroll runs are immutable.', 409));
    }

    const updated = await prisma.payrollRun.update({ where: { id: req.params.id as string }, data: req.body });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/runs/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  return next(new AppError('Method not allowed. Financial records cannot be deleted.', 405));
});

export default router;
