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
      const employee = await prisma.employee.create({
        data: {
          ...req.body,
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
        id: req.params.id,
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
    const employee = await prisma.employee.updateMany({
      where: {
        id: req.params.id,
        company_id: req.user?.company_id as string,
      },
      data: {
        ...req.body,
        date_of_joining: req.body.date_of_joining ? new Date(req.body.date_of_joining) : undefined,
        date_of_birth: req.body.date_of_birth ? new Date(req.body.date_of_birth) : undefined,
      },
    });
    if (employee.count === 0) return next(new AppError('Employee not found or unauthorized', 404));
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const result = await prisma.employee.deleteMany({
      where: {
        id: req.params.id,
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
