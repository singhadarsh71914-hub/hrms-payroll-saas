import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.ts';
import { AppError } from '../middleware/error.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// REGISTER
router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']),
    body('company_name').notEmpty(),
  ],
  async (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError('Validation failed', 400));

    try {
      const { email, password, role, company_name } = req.body;

      if (!email) {
        return next(new AppError('Email is required', 400));
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ 
        where: { email: String(email) } 
      });
      
      if (existingUser) return next(new AppError('User already exists', 400));

      const hashedPassword = await bcrypt.hash(password, 10);

      // Simple onboarding: Create company and user together
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: { name: company_name },
        });

        const user = await tx.user.create({
          data: {
            email,
            password_hash: hashedPassword,
            role: role || 'ADMIN',
            company_id: company.id,
          },
        });

        return { user, company };
      });

      res.status(201).json({
        message: 'User registered successfully',
        userId: result.user.id,
        companyId: result.company.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// LOGIN
router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  async (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new AppError('Validation failed', 400));

    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: String(email) },
        include: { company: true, employee: true },
      });

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return next(new AppError('Invalid credentials', 401));
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role, 
          company_id: user.company_id,
          email: user.email,
          employee_id: user.employee?.id 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          company: user.company,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
