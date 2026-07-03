import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { LeaveService } from '../services/leave.service.ts';
import { validate } from '../middleware/validate.ts';
import { createLeaveSchema, updateLeaveStatusSchema } from '../schemas/leave.schema.ts';

const router = Router();

router.use(authenticate);

// POST /apply
router.post(
  '/apply',
  validate(createLeaveSchema),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const isHR = req.user?.role === 'HR' || req.user?.role === 'ADMIN';
      let employeeId = req.user?.employee_id;

      if (isHR && req.body.employeeId) {
        employeeId = req.body.employeeId;
      }

      if (!employeeId) return next(new AppError('Employee profile not found', 404));

      const result = await LeaveService.applyLeave(employeeId, req.body);
      res.status(201).json(result);
    } catch (err: any) {
      next(new AppError(err.message, 400));
    }
  }
);

// GET /balances
router.get('/balances', async (req: AuthRequest, res: any, next: any) => {
  try {
    const isHR = req.user?.role === 'HR' || req.user?.role === 'ADMIN';
    let employeeId = req.user?.employee_id;
    
    if (isHR && req.query.employeeId) {
      employeeId = String(req.query.employeeId);
    }

    if (!employeeId) return next(new AppError('Employee profile not found', 404));

    const year = new Date().getFullYear();
    const balances = await LeaveService.getLeaveBalances(employeeId, year);
    res.json(balances);
  } catch (err) {
    next(err);
  }
});

// GET /requests
router.get('/requests', async (req: AuthRequest, res: any, next: any) => {
  try {
    const companyId = req.user?.company_id as string;
    const isHR = req.user?.role === 'HR' || req.user?.role === 'ADMIN';
    
    // If HR/Admin, they can see all. If Employee, only theirs.
    const employeeId = isHR ? undefined : req.user?.employee_id;
    
    const requests = await LeaveService.getLeaveRequests(companyId, employeeId);
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// PATCH /requests/:id/status
router.patch(
  '/requests/:id/status',
  authorize('ADMIN', 'HR'),
  validate(updateLeaveStatusSchema),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const approvedBy = req.user?.email as string;

      const result = await LeaveService.updateLeaveStatus(id as string, status, approvedBy);
      res.json(result);
    } catch (err: any) {
      next(new AppError(err.message, 400));
    }
  }
);

export default router;
