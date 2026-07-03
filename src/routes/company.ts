import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

// GET Company Details
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.company_id as string }
    });
    res.json(company);
  } catch (err) {
    next(err);
  }
});

// PUT Company Details
router.put('/', authorize('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const { name, trade_name, pan, tan, pf_registration_no, esi_registration_no, pt_registration_no, address, city, state, pincode, financial_year_start } = req.body;
    const company = await prisma.company.update({
      where: { id: req.user!.company_id as string },
      data: {
        name,
        trade_name,
        pan,
        tan,
        pf_registration_no,
        esi_registration_no,
        pt_registration_no,
        address,
        city,
        state,
        pincode,
        financial_year_start: financial_year_start ? Number(financial_year_start) : 4
      }
    });
    res.json({ message: 'Company settings updated successfully', company });
  } catch (err) {
    next(err);
  }
});

export default router;
