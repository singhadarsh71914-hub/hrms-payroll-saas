import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { LoanService } from '../services/loan.service.ts';
import { validate } from '../middleware/validate.ts';
import { applyLoanSchema, updateLoanStatusSchema } from '../schemas/loan.schema.ts';

const router = Router();

router.use(authenticate);

// APPLY LOAN (Employee or HR/Admin on behalf)
router.post(
  '/apply',
  validate(applyLoanSchema),
  async (req: AuthRequest, res: any, next: any) => {
    // Determine target employee ID
    let targetEmployeeId = req.user?.employee_id;
    const isHR = req.user?.role === 'HR' || req.user?.role === 'ADMIN';

    if (isHR && req.body.employeeId) {
      targetEmployeeId = req.body.employeeId;
    }

    if (!targetEmployeeId) {
      return next(new AppError('Employee profile not found or employeeId not provided', 403));
    }

    try {
      const loan = await LoanService.applyLoan(targetEmployeeId, req.body);
      res.status(201).json(loan);
    } catch (err: any) {
      next(err);
    }
  }
);

// GET ALL LOANS (HR/Admin)
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const loans = await LoanService.getAllLoans(req.user!.company_id!, req.query);
    res.json(loans);
  } catch (err) {
    next(err);
  }
});

// GET DASHBOARD STATS (HR/Admin)
router.get('/stats', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const stats = await LoanService.getLoansDashboardStats(req.user!.company_id!);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// GET MY LOANS (Employee)
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  if (!req.user?.employee_id) return next(new AppError('Employee profile not found', 403));
  try {
    const loans = await LoanService.getEmployeeLoans(req.user.employee_id);
    res.json(loans);
  } catch (err) {
    next(err);
  }
});

// GET LOAN DETAILS & SCHEDULE
router.get('/:id', async (req: AuthRequest, res: any, next: any) => {
  try {
    // @ts-ignore
    const loan = await LoanService.getLoanById(req.params.id);
    if (!loan) return next(new AppError('Loan not found', 404));
    
    // Security check: Employee can only see their own loan
    
    // @ts-ignore
    if (loan.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized access', 403));
    if (req.user?.role === 'EMPLOYEE' && loan.employee_id !== req.user.employee_id) {
    
      return next(new AppError('Unauthorized access', 403));
    }

    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// APPROVE LOAN (HR/Admin)
router.put('/:id/approve', authorize('ADMIN', 'HR'), validate(updateLoanStatusSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    
    const loanDataApprove = await import('../lib/prisma.ts').then(m => m.default.loan.findUnique({ where: { id: req.params.id as string }, include: { employee: true } }));
    if (!loanDataApprove || loanDataApprove.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized', 403));
    const loan = await LoanService.approveLoan(req.params.id as string, req.user!.id);
    
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// REJECT LOAN (HR/Admin)
router.put('/:id/reject', authorize('ADMIN', 'HR'), validate(updateLoanStatusSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    
    const loanDataReject = await import('../lib/prisma.ts').then(m => m.default.loan.findUnique({ where: { id: req.params.id as string }, include: { employee: true } }));
    if (!loanDataReject || loanDataReject.employee.company_id !== req.user?.company_id) return next(new AppError('Unauthorized', 403));
    const loan = await LoanService.rejectLoan(req.params.id as string, req.user!.id, req.body.remarks);
    
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

export default router;
