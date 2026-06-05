import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';

const router = Router();
router.use(authenticate);

// Get my reimbursements
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/reimbursements/my');
  try {
    const claims = await prisma.reimbursement.findMany({
      where: { employee: { user_id: req.user!.id } },
      orderBy: { created_at: 'desc' }
    });
    res.json(claims);
  } catch (err) {
    next(err);
  }
});

// Apply for reimbursement
router.post('/', async (req: AuthRequest, res: any, next: any) => {
  console.log('POST /api/reimbursements');
  try {
    const employee = await prisma.employee.findUnique({ where: { user_id: req.user!.id } });
    if (!employee) throw new Error("Employee not found");
    
    const claim = await prisma.reimbursement.create({
      data: {
        employee_id: employee.id,
        type: req.body.type,
        amount: Number(req.body.amount),
        description: req.body.description
      }
    });
    res.json(claim);
  } catch (err) {
    next(err);
  }
});

// Get all reimbursements
router.get('/', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/reimbursements');
  try {
    const claims = await prisma.reimbursement.findMany({
      where: { employee: { company_id: req.user!.company_id! } },
      include: { employee: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(claims);
  } catch (err) {
    next(err);
  }
});

// Process reimbursement
router.put('/:id/status', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`PUT /api/reimbursements/${req.params.id}/status`);
  try {
    const { status, remarks } = req.body;
    const claim = await prisma.reimbursement.update({
      where: { id: req.params.id },
      data: { status, remarks, approved_by: req.user!.id, approved_at: new Date() }
    });
    res.json(claim);
  } catch (err) {
    next(err);
  }
});

export default router;
