import { Router } from 'express';
import { SalaryService } from '../services/salary.service.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { reviseSalarySchema } from '../schemas/salary.schema.ts';

const router = Router();

// Get salary history for an employee
router.get('/history/:employeeId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const isSelf = req.user?.employee_id === req.params.employeeId;
    const isManager = ['ADMIN', 'HR', 'MANAGER'].includes(req.user?.role || '');
    if (!isSelf && !isManager) return next(new Error('Unauthorized access'));

    // @ts-ignore
    const history = await SalaryService.getRevisionHistory(req.params.employeeId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Revise salary
router.post('/revise', authenticate, authorize('ADMIN', 'HR'), validate(reviseSalarySchema), async (req: AuthRequest, res, next) => {
  try {
    const result = await SalaryService.reviseSalary({
      ...req.body,
      createdBy: req.user!.id
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
