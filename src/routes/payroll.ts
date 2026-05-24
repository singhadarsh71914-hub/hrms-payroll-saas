import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { PayrollService } from '../services/payroll.service.ts';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /:runId/payslip/:employeeId
router.get('/:runId/payslip/:employeeId', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { runId, employeeId } = req.params;
    const doc = await PayrollService.generatePayslipPDF(runId as string, employeeId as string);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${employeeId}.pdf`);

    doc.pipe(res);
  } catch (err) {
    next(err);
  }
});

// POST /run
router.post(
  '/run',
  authorize('ADMIN', 'HR'),
  [
    body('month').isInt({ min: 1, max: 12 }),
    body('year').isInt({ min: 2020, max: 2100 }),
  ],
  async (req: AuthRequest, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError('Validation failed', 400));

    try {
      const { month, year } = req.body;
      const companyId = req.user?.company_id as string;
      const result = await PayrollService.processPayroll(companyId, month, year);
      res.status(201).json(result);
    } catch (err: any) {
      next(new AppError(err.message, 400));
    }
  }
);

// GET /runs
router.get('/runs', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user?.company_id as string;
    const runs = await PayrollService.getPayrollRuns(companyId);
    res.json(runs);
  } catch (err) {
    next(err);
  }
});

// GET /runs/:id/payslips
router.get('/runs/:id/payslips', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const payslips = await PayrollService.getPayslipsForRun(req.params.id as string);
    res.json(payslips);
  } catch (err) {
    next(err);
  }
});

export default router;
