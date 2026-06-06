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
      const allowedFields = [
        'employee_code', 'first_name', 'last_name', 'display_name', 'gender', 'date_of_birth',
        'date_of_joining', 'date_of_leaving', 'employment_status', 'employment_type',
        'department_id', 'designation_id', 'reporting_manager_id', 'work_location',
        'address_line1', 'address_line2', 'city', 'state', 'pincode', 'country',
        'work_email', 'personal_email', 'phone', 'emergency_contact_name',
        'emergency_contact_phone', 'emergency_contact_relationship',
        'pan_number', 'aadhaar_number', 'uan_number', 'esic_ip_number',
        'bank_name', 'bank_account_number', 'bank_ifsc', 'probation_end_date',
        'notice_period_days', 'avatar_url'
      ];

      const createData: any = {};
      const unknownFields: string[] = [];

      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          createData[key] = req.body[key];
        } else {
          unknownFields.push(key);
        }
      });

      if (unknownFields.length > 0) {
        return res.status(400).json({ 
          message: 'Invalid employee profile field', 
          details: `Unknown fields: ${unknownFields.join(', ')}` 
        });
      }

      // Type conversions
      if (createData.date_of_joining) createData.date_of_joining = new Date(createData.date_of_joining);
      if (createData.date_of_birth) createData.date_of_birth = new Date(createData.date_of_birth);
      if (createData.date_of_leaving) createData.date_of_leaving = new Date(createData.date_of_leaving);
      if (createData.probation_end_date) createData.probation_end_date = new Date(createData.probation_end_date);
      if (createData.notice_period_days) createData.notice_period_days = parseInt(createData.notice_period_days);

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

// GET EMPLOYEE ATTENDANCE
router.get('/:id/attendance', async (req: AuthRequest, res: any, next: any) => {
  try {
    const { month, year } = req.query;
    // Security check: Verify employee belongs to the same company
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, company_id: req.user?.company_id as string }
    });
    if (!employee) return next(new AppError('Employee not found or unauthorized', 404));

    const attendance = await AttendanceService.getEmployeeAttendance(
      req.params.id,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    
    // Calculate stats
    const stats = {
      PRESENT: attendance.filter(a => a.status === 'PRESENT').length,
      ABSENT: attendance.filter(a => a.status === 'ABSENT').length,
      HALF_DAY: attendance.filter(a => a.status === 'HALF_DAY').length,
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
        employee_id: req.params.id,
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
        employee_id: req.params.id,
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
        employee_id: req.params.id,
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
        employee_id: req.params.id,
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
router.put('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const allowedFields = [
      'employee_code', 'first_name', 'last_name', 'display_name', 'gender', 'date_of_birth',
      'date_of_joining', 'date_of_leaving', 'employment_status', 'employment_type',
      'department_id', 'designation_id', 'reporting_manager_id', 'work_location',
      'address_line1', 'address_line2', 'city', 'state', 'pincode', 'country',
      'work_email', 'personal_email', 'phone', 'emergency_contact_name',
      'emergency_contact_phone', 'emergency_contact_relationship',
      'pan_number', 'aadhaar_number', 'uan_number', 'esic_ip_number',
      'bank_name', 'bank_account_number', 'bank_ifsc', 'probation_end_date',
      'notice_period_days', 'avatar_url'
    ];

    const updateData: any = {};
    const unknownFields: string[] = [];

    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      } else {
        unknownFields.push(key);
      }
    });

    if (unknownFields.length > 0) {
      return res.status(400).json({ 
        message: 'Invalid employee profile field', 
        details: `Unknown fields: ${unknownFields.join(', ')}` 
      });
    }

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
    
    res.json({ message: 'Employee updated successfully', employee: updated });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return next(new AppError('Email already exists', 400));
    }
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
