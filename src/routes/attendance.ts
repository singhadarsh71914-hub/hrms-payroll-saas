import { logError } from '../utils/logError.ts';
import { Router } from 'express';
import { AttendanceService } from '../services/attendance.service.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { markAttendanceSchema } from '../schemas/attendance.schema.ts';
import prisma from '../lib/prisma.ts';

const router = Router();

// Mark attendance (legacy admin)
router.post('/mark', authenticate, authorize('ADMIN', 'HR'), validate(markAttendanceSchema), async (req, res, next) => {
  try {
    // @ts-ignore
    const result = await AttendanceService.markAttendance({ ...req.body, companyId: req.user!.company_id!, userId: req.user!.id });
    res.json(result);
  } catch (error: any) {
    console.error('===== MARK ATTENDANCE ERROR =====');
    console.error('REQUEST PAYLOAD:', req.body);
    console.error('ERROR TYPE:', error.constructor?.name);
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    
    // Explicitly send 409 if the logic threw a 409 error
    if (error.status === 409 || error.code === 'ATTENDANCE_ALREADY_SUBMITTED') {
      return res.status(409).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    }

    next(error);
  }
});

// Enroll Face
router.post('/enroll-face', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore

    // Bypass env check for E2E

    const descriptor = req.body.descriptor;

    if (!descriptor) {
      throw new Error("Descriptor missing");
    }
    
    if (!Array.isArray(descriptor)) {
      throw new Error("Descriptor is not an array");
    }
    
    if (descriptor.length !== 128) {
      throw new Error(
        `Expected 128 dimensions, got ${descriptor.length}`
      );
    }

    console.log({
      // @ts-ignore
      userId: req.user?.id,
      // @ts-ignore
      employeeId: req.user?.employee_id,
      // @ts-ignore
      companyId: req.user?.company_id
    });

    const employee = await prisma.employee.findFirst({
      where: {
        // @ts-ignore
        user_id: req.user!.id,
        // @ts-ignore
        company_id: req.user!.company_id
      }
    });

    if (!employee) {
      return res.status(404).json({
        code: "EMPLOYEE_NOT_FOUND"
      });
    }

    // Step 6: Verify database persistence
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        face_descriptor: descriptor,
        face_enrolled_at: new Date(),
        biometric_enabled: true
      }
    });

    const updated = await prisma.employee.findUnique({
      where: { id: employee.id }
    });
    

    return res.json({ success: true });
  } catch (err: any) {
    logError('ATTENDANCE.TS', req, err);
    next(err);
  }
});

// Check-In
router.post('/check-in', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const geoData = {
      ...req.body.geoData,
      ip: req.ip || req.connection.remoteAddress,
      device_info: req.headers['user-agent']
    };
    
    // Bypass face matching if feature flag is not enabled
    let biometricData = req.body.biometricData;
    if (process.env.ENABLE_ADVANCED_BIOMETRICS !== 'true') {
      biometricData = null; // Do not use biometric data for trust score / checks
    }

    // @ts-ignore
    const result = await AttendanceService.checkIn(employeeId, req.user!.company_id!, req.user!.id, geoData, biometricData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Check-Out
router.post('/check-out', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const geoData = {
      ...req.body.geoData,
      ip: req.ip || req.connection.remoteAddress
    };
    const biometricData = req.body.biometricData;
    // @ts-ignore
    const result = await AttendanceService.checkOut(employeeId, req.user!.id, geoData, biometricData);
    res.json(result);
  } catch (error) {
    next(error);
  }
});


// Start Break
router.post('/break/start', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.startBreak(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// End Break
router.post('/break/end', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.endBreak(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// My Attendance
router.get('/my', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.getMyAttendance(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Current Session
router.get('/current-session', authenticate, async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.getCurrentSession(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Today's Attendance (Admin/HR)
router.get('/today', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    // @ts-ignore
    const result = await AttendanceService.getTodayAttendance(req.user!.company_id!);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Team Attendance (Manager)
router.get('/team', authenticate, authorize('MANAGER', 'ADMIN', 'HR'), async (req, res, next) => {
  try {
    // @ts-ignore
    const employeeId = req.user?.employee_id;
    if (!employeeId) throw new Error('Not linked to an employee profile');
    const result = await AttendanceService.getTeamAttendance(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get attendance report
router.get('/report', authenticate, async (req, res, next) => {
  try {
    const monthParam = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
    const yearParam = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    // @ts-ignore
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getAttendanceReport(
      companyId,
      monthParam,
      yearParam
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get monthly summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const monthParam = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
    const yearParam = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    // @ts-ignore
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getMonthlySummary(
      companyId,
      monthParam,
      yearParam
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET Intelligence Dashboard
router.get('/intelligence', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    // @ts-ignore
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getIntelligenceDashboard(companyId);
    res.json(result);
  } catch (error: any) {
    console.error("===== ATTENDANCE INTELLIGENCE ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    // @ts-ignore
    console.error("USER:", req.user);
    console.error("TYPE:", error.constructor?.name);
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    return next(error);
  }
});

// GET Live Workforce
router.get('/live', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    // @ts-ignore
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getLiveWorkforce(companyId);
    res.json(result);
  } catch (error: any) {
    console.error("===== ATTENDANCE INTELLIGENCE ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    // @ts-ignore
    console.error("USER:", req.user);
    console.error("TYPE:", error.constructor?.name);
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    return next(error);
  }
});

// GET Attendance Risks
router.get('/risks', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    // @ts-ignore
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getAttendanceRisks(companyId);
    res.json(result);
  } catch (error: any) {
    console.error("===== ATTENDANCE INTELLIGENCE ERROR =====");
    console.error("ROUTE:", req.originalUrl);
    // @ts-ignore
    console.error("USER:", req.user);
    console.error("TYPE:", error.constructor?.name);
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
    return next(error);
  }
});

export default router;
