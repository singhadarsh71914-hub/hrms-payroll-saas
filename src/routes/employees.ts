import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { sendEmail } from '../lib/email.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Employee
        const employee = await tx.employee.create({
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

        // 2. Create User for Employee
        // Generate a random temp password (it will be reset via token)
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await tx.user.create({
          data: {
            email: rest.work_email,
            password_hash: hashedPassword,
            role: 'EMPLOYEE',
            company_id: req.user?.company_id as string,
          }
        });

        // 3. Link User back to Employee
        const updatedEmployee = await tx.employee.update({
          where: { id: employee.id },
          data: { user_id: user.id }
        });

        return { employee: updatedEmployee, user };
      });

      // 4. Generate Welcome Token (valid for 48 hours)
      const welcomeToken = jwt.sign(
        { userId: result.user.id, type: 'SET_PASSWORD' },
        JWT_SECRET,
        { expiresIn: '48h' }
      );

      // 5. Send Welcome Email
      const setPasswordUrl = `http://localhost:5173/set-password?token=${welcomeToken}`;
      
      sendEmail(
        result.employee.work_email,
        'Welcome to the Team!',
        `
          <h1>Welcome, ${result.employee.first_name}!</h1>
          <p>You have been added to the HRMS portal.</p>
          <p>Please set your password by clicking the link below:</p>
          <a href="${setPasswordUrl}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Set Password</a>
          <p>Alternatively, copy and paste this link into your browser:</p>
          <p>${setPasswordUrl}</p>
          <p>This link will expire in 48 hours.</p>
        `
      ).catch(err => console.error('Failed to send welcome email:', err));

      res.status(201).json(result.employee);
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
