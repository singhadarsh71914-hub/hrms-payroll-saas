import { Router } from 'express';
import { HolidayService } from '../services/holiday.service.ts';
import { authenticate, authorize } from '../middleware/auth.ts';

const router = Router();

// Add/Update holiday
router.post('/', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    const companyId = req.user!.company_id!;
    const result = await HolidayService.addHoliday({
      ...req.body,
      companyId
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get holidays
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { year } = req.query;
    const companyId = req.user!.company_id!;
    const result = await HolidayService.getHolidays(
      companyId,
      parseInt(year as string || new Date().getFullYear().toString())
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Delete holiday
router.delete('/:id', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    const companyId = req.user!.company_id!;
    await HolidayService.deleteHoliday(req.params.id, companyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Seed holidays
router.post('/seed', authenticate, authorize('ADMIN', 'HR'), async (req, res, next) => {
  try {
    const { year } = req.body;
    const companyId = req.user!.company_id!;
    const result = await HolidayService.seedNationalHolidays(
      companyId,
      parseInt(year || new Date().getFullYear())
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
