import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { LoanService } from '../services/loan.service.ts';

const router = Router();

router.use(authenticate);

// APPLY LOAN (Employee or HR/Admin on behalf)
router.post(
  '/apply',
  [
    body('loanType').isIn(['PERSONAL', 'MEDICAL', 'EMERGENCY', 'EDUCATION', 'HOME']),
    body('principalAmount').isNumeric(),
    body('interestRate').isNumeric(),
    body('tenureMonths').isInt({ min: 1 }),
    body('startDate').isISO8601(),
  ],
  async (req: AuthRequest, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError('Validation failed', 400));
    }

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
    const loan = await LoanService.getLoanById(req.params.id);
    if (!loan) return next(new AppError('Loan not found', 404));
    
    // Security check: Employee can only see their own loan
    if (req.user?.role === 'EMPLOYEE' && loan.employee_id !== req.user.employee_id) {
      return next(new AppError('Unauthorized access', 403));
    }

    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// APPROVE LOAN (HR/Admin)
router.put('/:id/approve', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const loan = await LoanService.approveLoan(req.params.id, req.user!.id);
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// REJECT LOAN (HR/Admin)
router.put('/:id/reject', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const loan = await LoanService.rejectLoan(req.params.id, req.user!.id, req.body.remarks);
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

export default router;
