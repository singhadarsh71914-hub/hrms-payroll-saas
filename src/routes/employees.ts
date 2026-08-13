import { logError } from '../utils/logError.ts';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { sendEmail } from '../lib/email.ts';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { AttendanceService } from '../services/attendance.service.ts';
import { AuditService, AuditAction } from '../services/audit.service.ts';
import { validate } from '../middleware/validate.ts';
import { createEmployeeSchema, updateEmployeeSchema } from '../schemas/employee.schema.ts';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

// Apply authentication to all routes
router.use(authenticate);

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  }
});

// GET ALL EMPLOYEES
router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const includeInactive = req.query.include_inactive === 'true' && req.user?.role === 'ADMIN';
    const whereClause: any = { company_id: req.user?.company_id as string };
    
    if (!includeInactive) {
      whereClause.is_active = true;
    }

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: { department: true, designation: true },
    });
    return res.json(employees);
  } catch (err) {
    next(err);
  }
});

// CREATE EMPLOYEE
router.post(
  '/',
  authorize('ADMIN', 'HR'),
  validate(createEmployeeSchema),
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const createData = { ...req.body };

      // Proactive duplicate checks
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          OR: [
            { work_email: createData.work_email },
            { employee_code: createData.employee_code }
          ]
        }
      });

      if (existingEmployee) {
        if (existingEmployee.work_email === createData.work_email) {
          return res.status(409).json({
            status: 'error',
            field: 'work_email',
            message: 'An employee with this work email already exists.'
          });
        }
        if (existingEmployee.employee_code === createData.employee_code) {
          return res.status(409).json({
            status: 'error',
            field: 'employee_code',
            message: 'Employee code already exists.'
          });
        }
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: createData.work_email }
      });

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          field: 'work_email',
          message: 'A user account with this email already exists.'
        });
      }

      // Type conversions
      if (createData.date_of_joining) createData.date_of_joining = new Date(createData.date_of_joining);
      if (createData.date_of_birth) createData.date_of_birth = new Date(createData.date_of_birth);
      else delete createData.date_of_birth;
      
      if (createData.date_of_leaving) createData.date_of_leaving = new Date(createData.date_of_leaving);
      else delete createData.date_of_leaving;
      
      if (createData.probation_end_date) createData.probation_end_date = new Date(createData.probation_end_date);
      else delete createData.probation_end_date;
      
      if (createData.notice_period_days) createData.notice_period_days = parseInt(createData.notice_period_days);
      else delete createData.notice_period_days;

      // Handle relations
      if (!createData.department_id) delete createData.department_id;
      if (!createData.designation_id) delete createData.designation_id;
      if (!createData.reporting_manager_id) delete createData.reporting_manager_id;
      
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Employee
        const employee = await tx.employee.create({
          data: {
            ...createData,
            company_id: req.user?.company_id as string,
          },
        });

        // 2. Create User for Employee
        const tempPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await tx.user.create({
          data: {
            email: createData.work_email,
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
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const setPasswordUrl = `${baseUrl}/set-password?token=${welcomeToken}`;
      
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

      await AuditService.log({
        userId: req.user?.id,
        companyId: req.user?.company_id as string,
        action: AuditAction.EMPLOYEE_CREATE,
        entityType: 'EMPLOYEE',
        entityId: result.employee.id,
        metadata: { employee_code: result.employee.employee_code, name: `${result.employee.first_name} ${result.employee.last_name}` },
        ipAddress: req.ip,
      });

      res.status(201).json(result.employee);
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta as any)?.target as string[] | string | undefined;
        const targetStr = Array.isArray(target) ? target.join(',') : (target || '');

        if (targetStr.includes('work_email') || targetStr.includes('email')) {
          return res.status(409).json({
            status: 'error',
            field: 'work_email',
            message: 'An employee with this work email already exists.'
          });
        }
        if (targetStr.includes('employee_code')) {
          return res.status(409).json({
            status: 'error',
            field: 'employee_code',
            message: 'Employee code already exists.'
          });
        }
        return res.status(409).json({
          status: 'error',
          message: 'Duplicate data detected.'
        });
      }
      next(error);
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

// GET EMPLOYEE ATTENDANCE
router.get('/:id/attendance', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { month, year } = req.query;
    // Security check: Verify employee belongs to the same company
    const employee = await prisma.employee.findFirst({
      // @ts-ignore
      where: { id: req.params.id, company_id: req.user?.company_id as string }
    });
    if (!employee) return next(new AppError('Employee not found or unauthorized', 404));

    // @ts-ignore
    const attendance = await AttendanceService.getEmployeeAttendance(
      req.params.id,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    
    // Calculate stats
    const stats = {
      // @ts-ignore
      PRESENT: attendance.filter(a => a.status === 'PRESENT').length,
      // @ts-ignore
      ABSENT: attendance.filter(a => a.status === 'ABSENT').length,
      // @ts-ignore
      HALF_DAY: attendance.filter(a => a.status === 'HALF_DAY').length,
      // @ts-ignore
      ON_LEAVE: attendance.filter(a => a.status === 'ON_LEAVE').length,
      total: attendance.length
    };

    res.json({ attendance, stats });
  } catch (err) {
    next(err);
  }
});

// GET EMPLOYEE LEAVES
router.get('/:id/leaves', async (req: AuthRequest, res: any, next: any) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: { 
        // @ts-ignore
        employee_id: req.params.id as string,
        employee: { company_id: req.user?.company_id as string }
      },
      orderBy: { start_date: 'desc' }
    });
    res.json(leaves);
  } catch (err) {
    next(err);
  }
});

// GET EMPLOYEE PAYROLLS
router.get('/:id/payrolls', async (req: AuthRequest, res: any, next: any) => {
  try {
    const payrolls = await prisma.payslip.findMany({
      where: { 
        // @ts-ignore
        employee_id: req.params.id as string,
        employee: { company_id: req.user?.company_id as string }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    res.json(payrolls);
  } catch (err) {
    next(err);
  }
});

// GET EMPLOYEE DOCUMENTS
router.get('/:id/documents', async (req: AuthRequest, res: any, next: any) => {
  try {
    const docs = await prisma.employeeDocument.findMany({
      where: { 
        // @ts-ignore
        employee_id: req.params.id as string,
        employee: { company_id: req.user?.company_id as string }
      },
      orderBy: { uploaded_at: 'desc' }
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// GET EMPLOYEE LOANS
router.get('/:id/loans', async (req: AuthRequest, res: any, next: any) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { 
        // @ts-ignore
        employee_id: req.params.id as string,
        employee: { company_id: req.user?.company_id as string }
      },
      include: { repayments: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(loans);
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.put('/:id', authorize('ADMIN', 'HR'), validate(updateEmployeeSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const updateData = { ...req.body };

    // First verify ownership
    const existing = await prisma.employee.findFirst({
      where: {
        id: req.params.id as string,
        company_id: req.user?.company_id as string,
      }
    });

    if (!existing) return next(new AppError('Employee not found or unauthorized', 404));

    // Type conversions
    if (updateData.date_of_joining) updateData.date_of_joining = new Date(updateData.date_of_joining);
    if (updateData.date_of_birth) updateData.date_of_birth = new Date(updateData.date_of_birth);
    if (updateData.date_of_leaving) updateData.date_of_leaving = new Date(updateData.date_of_leaving);
    if (updateData.probation_end_date) updateData.probation_end_date = new Date(updateData.probation_end_date);
    if (updateData.notice_period_days) updateData.notice_period_days = parseInt(updateData.notice_period_days);

    // Handle relations
    if (updateData.department_id === '') updateData.department_id = null;
    if (updateData.designation_id === '') updateData.designation_id = null;
    if (updateData.reporting_manager_id === '') updateData.reporting_manager_id = null;

    const updated = await prisma.employee.update({
      where: { id: req.params.id as string },
      data: updateData,
    });
    
    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id as string,
      action: AuditAction.EMPLOYEE_EDIT,
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      metadata: { employee_code: updated.employee_code, changes: Object.keys(updateData) },
      ipAddress: req.ip,
    });

    res.json({ message: 'Employee updated successfully', employee: updated });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return next(new AppError('Email already exists', 400));
    }
    next(err);
  }
});

// DELETE (Soft Delete)
router.delete('/:id', authorize('ADMIN'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const existing = await prisma.employee.findFirst({
      where: {
        id: req.params.id as string,
        company_id: req.user?.company_id as string,
      }
    });

    if (!existing) return next(new AppError('Employee not found or unauthorized', 404));

    await prisma.employee.update({
      where: { id: req.params.id as string },
      data: {
        is_active: false,
        deleted_at: new Date()
      }
    });

    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id as string,
      action: AuditAction.EMPLOYEE_DEACTIVATE,
      entityType: 'EMPLOYEE',
      // @ts-ignore
      entityId: req.params.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Employee deactivated successfully' });
  } catch (err) {
    next(err);
  }
});

// RESTORE
router.post('/:id/restore', authorize('ADMIN'), async (req: AuthRequest, res: any, next: any) => {
  try {
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
        is_active: true,
        deleted_at: null
      }
    });

    await AuditService.log({
      userId: req.user?.id,
      companyId: req.user?.company_id as string,
      action: AuditAction.EMPLOYEE_RESTORE,
      entityType: 'EMPLOYEE',
      entityId: updated.id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Employee restored successfully', employee: updated });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return next(new AppError('Cannot restore: employee code or email conflict', 400));
    }
    next(err);
  }
});


// UPLOAD AVATAR
router.post('/:id/avatar', authorize('ADMIN', 'HR', 'EMPLOYEE'), uploadAvatar.single('avatar'), async (req: AuthRequest, res: any, next: any) => {
  try {
    if (!req.file) return next(new AppError('No image uploaded', 400));
    
    // Ensure permission
    if (req.user?.role === 'EMPLOYEE' && req.user?.id !== req.params.id) {
      // Need to find if user's employee matches
      const emp = await prisma.employee.findFirst({ where: { user_id: req.user.id }});
      if (emp?.id !== req.params.id) return next(new AppError('Unauthorized', 403));
    }

    const employee = await prisma.employee.findUnique({ where: { id: req.params.id as string }});
    if (!employee) return next(new AppError('Employee not found', 404));

    // Delete old avatar
    if (employee.avatar_url) {
      const oldPath = path.join(process.cwd(), employee.avatar_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = req.file.path.replace(/\\/g, '/'); // Normalize path

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { avatar_url: avatarUrl }
    });

    res.json({ message: 'Avatar updated successfully', avatar_url: avatarUrl });
  } catch (err) {
    next(err);
  }
});

// DELETE AVATAR
router.delete('/:id/avatar', authorize('ADMIN', 'HR', 'EMPLOYEE'), async (req: AuthRequest, res: any, next: any) => {
  try {
    // Ensure permission
    if (req.user?.role === 'EMPLOYEE' && req.user?.id !== req.params.id) {
      const emp = await prisma.employee.findFirst({ where: { user_id: req.user.id }});
      if (emp?.id !== req.params.id) return next(new AppError('Unauthorized', 403));
    }

    const employee = await prisma.employee.findUnique({ where: { id: req.params.id as string }});
    if (!employee || !employee.avatar_url) return res.json({ message: 'No avatar to delete' });

    const oldPath = path.join(process.cwd(), employee.avatar_url);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    await prisma.employee.update({
      where: { id: employee.id },
      data: { avatar_url: null }
    });

    res.json({ message: 'Avatar removed' });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// BONUSES & INCENTIVES
// ==========================================

router.get('/:id/bonuses', authenticate, authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any) => {
  try {
    const bonuses = await prisma.employeeBonus.findMany({
      where: { employee_id: req.params.id as string, is_active: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(bonuses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/bonuses', authenticate, authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any) => {
  try {
    const { type, name, description, amount, taxable, recurring, start_date, end_date, effective_month, category, status } = req.body;
    
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (recurring && !start_date) {
      return res.status(400).json({ error: 'Start date is required for recurring bonuses' });
    }

    const bonus = await prisma.employeeBonus.create({
      data: {
        employee_id: req.params.id as string,
        company_id: req.user!.company_id as string,
        type,
        category: category || 'FIXED_BONUS',
        status: status || 'APPROVED',
        name,
        description,
        amount,
        taxable: taxable ?? true,
        recurring: recurring ?? false,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        effective_month: effective_month || null,
        created_by: req.user!.id
      }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'CREATE_BONUS',
        entity_type: 'EmployeeBonus',
        entity_id: bonus.id,
        metadata: { employee_id: req.params.id as string, type, amount }
      }
    });

    res.status(201).json(bonus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/bonuses/:bonusId', authenticate, authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any) => {
  try {
    const { type, name, description, amount, taxable, recurring, start_date, end_date, effective_month, category, status } = req.body;
    
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const bonus = await prisma.employeeBonus.update({
      where: { id: req.params.bonusId as string },
      data: {
        type,
        category: category || 'FIXED_BONUS',
        status: status || 'APPROVED',
        name,
        description,
        amount,
        taxable: taxable ?? true,
        recurring: recurring ?? false,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        effective_month: effective_month || null
      }
    });
    res.json(bonus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/bonuses/:bonusId', authenticate, authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any) => {
  try {
    await prisma.employeeBonus.update({
      where: { id: req.params.bonusId as string },
      data: { is_active: false }
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user!.id,
        action: 'ARCHIVE_BONUS',
        entity_type: 'EmployeeBonus',
        entity_id: req.params.bonusId as string
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
