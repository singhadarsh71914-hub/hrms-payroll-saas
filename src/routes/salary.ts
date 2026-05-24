import { Router } from 'express';
import { SalaryService } from '../services/salary.service.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Get salary history for an employee
router.get('/history/:employeeId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const history = await SalaryService.getRevisionHistory(req.params.employeeId);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Revise salary
router.post('/revise', authenticate, authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
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
