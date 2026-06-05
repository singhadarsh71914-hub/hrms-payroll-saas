import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';

const router = Router();
router.use(authenticate);

// Get my performance reviews
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/performance/my');
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { employee: { user_id: req.user!.id } },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Get all performance reviews
router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  console.log('GET /api/performance');
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { employee: { company_id: req.user!.company_id! } },
      include: { employee: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Create performance review
router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  console.log('POST /api/performance');
  try {
    const { employee_id, cycle_name, review_period, goals_rating, skills_rating, attitude_rating, leadership_rating, remarks } = req.body;
    const overall_score = (goals_rating + skills_rating + attitude_rating + leadership_rating) / 4;
    
    let badge = 'Needs Improvement';
    if (overall_score >= 4.5) badge = 'Excellent';
    else if (overall_score >= 3.5) badge = 'Good';
    else if (overall_score >= 2.5) badge = 'Average';

    const review = await prisma.performanceReview.create({
      data: {
        company_id: req.user!.company_id!,
        employee_id,
        cycle_name,
        review_period,
        goals_rating,
        skills_rating,
        attitude_rating,
        leadership_rating,
        overall_score,
        badge,
        remarks,
        reviewed_by: req.user!.id
      }
    });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// Update performance review
router.put('/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`PUT /api/performance/${req.params.id}`);
  try {
    const { cycle_name, review_period, goals_rating, skills_rating, attitude_rating, leadership_rating, remarks } = req.body;
    const overall_score = (goals_rating + skills_rating + attitude_rating + leadership_rating) / 4;
    
    let badge = 'Needs Improvement';
    if (overall_score >= 4.5) badge = 'Excellent';
    else if (overall_score >= 3.5) badge = 'Good';
    else if (overall_score >= 2.5) badge = 'Average';

    const review = await prisma.performanceReview.update({
      where: { id: req.params.id },
      data: {
        cycle_name,
        review_period,
        goals_rating,
        skills_rating,
        attitude_rating,
        leadership_rating,
        overall_score,
        badge,
        remarks
      }
    });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// Delete performance review
router.delete('/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  console.log(`DELETE /api/performance/${req.params.id}`);
  try {
    await prisma.performanceReview.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
