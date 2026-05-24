import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET ALL EMPLOYEES
router.get('/', async (req: AuthRequest, res: any, next: any) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { company_id: req.user?.company_id as string },
      include: { department: true, designation: true },
    });
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// CREATE EMPLOYEE
router.post(
  '/',
  authorize('ADMIN', 'HR'),
  [
    body('employee_code').notEmpty(),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('work_email').isEmail(),
    body('date_of_joining').isISO8601(),
  ],
  async (req: AuthRequest, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError('Validation failed', 400));

    try {
      const { department_id, designation_id, reporting_manager_id, ...rest } = req.body;
      const employee = await prisma.employee.create({
        data: {
          ...rest,
          department_id: department_id || null,
          designation_id: designation_id || null,
          reporting_manager_id: reporting_manager_id || null,
          company_id: req.user?.company_id as string,
          date_of_joining: new Date(req.body.date_of_joining),
          date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : null,
        },
      });
      res.status(201).json(employee);
    } catch (err) {
      next(err);
    }
  }
);

// GET SINGLE
router.get('/:id', async (req: AuthRequest, res: any, next: any) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: req.params.id as string,
        company_id: req.user?.company_id as string,
      },
      include: { department: true, designation: true, reporting_manager: true },
    });
    if (!employee) return next(new AppError('Employee not found', 404));
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.put('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const { department_id, designation_id, reporting_manager_id, ...rest } = req.body;
    
    // First verify ownership
    const existing = await prisma.employee.findFirst({
      where: {
        id: req.params.id as string,
        company_id: req.user?.company_id as string,
      }
    });

    if (!existing) return next(new AppError('Employee not found or unauthorized', 404));

    const updated = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: {
        ...rest,
        department_id: department_id || null,
        designation_id: designation_id || null,
        reporting_manager_id: reporting_manager_id || null,
        date_of_joining: req.body.date_of_joining ? new Date(req.body.date_of_joining) : undefined,
        date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : undefined,
      },
    });
    
    res.json({ message: 'Employee updated successfully', employee: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const result = await prisma.employee.deleteMany({
      where: {
        id: req.params.id as string,
        company_id: req.user?.company_id as string,
      },
    });
    if (result.count === 0) return next(new AppError('Employee not found or unauthorized', 404));
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
