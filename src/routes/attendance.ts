import { Router } from 'express';
import { AttendanceService } from '../services/attendance.service.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Mark attendance
router.post('/mark', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    const result = await AttendanceService.markAttendance(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get attendance report
router.get('/report', authenticate, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getAttendanceReport(
      companyId,
      parseInt(month as string),
      parseInt(year as string)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get monthly summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user!.company_id!;
    const result = await AttendanceService.getMonthlySummary(
      companyId,
      parseInt(month as string),
      parseInt(year as string)
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
