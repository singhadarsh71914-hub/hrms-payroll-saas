import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate);

// DEPARTMENTS
router.get('/departments', async (req: AuthRequest, res) => {
  const departments = await prisma.department.findMany({
    where: { company_id: req.user?.company_id as string },
  });
  res.json(departments);
});

router.post('/departments', authorize('ADMIN', 'HR'), async (req: AuthRequest, res) => {
  const dept = await prisma.department.create({
    data: { ...req.body, company_id: req.user?.company_id as string },
  });
  res.status(201).json(dept);
});

// DESIGNATIONS
router.get('/designations', async (req: AuthRequest, res) => {
  const designations = await prisma.designation.findMany({
    where: { company_id: req.user?.company_id as string },
  });
  res.json(designations);
});

router.post('/designations', authorize('ADMIN', 'HR'), async (req: AuthRequest, res) => {
  const desig = await prisma.designation.create({
    data: { ...req.body, company_id: req.user?.company_id as string },
  });
  res.status(201).json(desig);
});

export default router;
