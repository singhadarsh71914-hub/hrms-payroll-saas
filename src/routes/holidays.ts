import { Router } from 'express';
import { HolidayService } from '../services/holiday.service.ts';
import { authenticate, authorize } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { createHolidaySchema, seedHolidaysSchema } from '../schemas/holiday.schema.ts';

const router = Router();

// Add/Update holiday
router.post('/', authenticate, authorize('ADMIN', 'HR'), validate(createHolidaySchema), async (req, res, next) => {
  try {
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
    const companyId = req.user!.company_id!;
    // @ts-ignore
    await HolidayService.deleteHoliday(req.params.id, companyId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Seed holidays
router.post('/seed', authenticate, authorize('ADMIN', 'HR'), validate(seedHolidaysSchema), async (req, res, next) => {
  try {
    const { year } = req.body;
    // @ts-ignore
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
