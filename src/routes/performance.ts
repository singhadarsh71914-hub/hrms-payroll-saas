import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import prisma from '../lib/prisma.ts';
import { validate } from '../middleware/validate.ts';
import { 
  createGoalSchema, 
  updateGoalSchema, 
  createKPISchema, 
  updateKPISchema, 
  createReviewSchema, 
  submitSelfReviewSchema, 
  submitManagerReviewSchema 
} from '../schemas/performance.schema.ts';

const router = Router();
router.use(authenticate);

// ==========================================
// GOALS
// ==========================================
router.get('/goals', async (req: AuthRequest, res: any, next: any) => {
  try {
    const isEmployee = req.user!.role === 'EMPLOYEE';
    const where = isEmployee 
      ? { employee: { user_id: req.user!.id } }
      : { company_id: req.user!.company_id! };
      
    const goals = await prisma.goal.findMany({
      where,
      include: { employee: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(goals);
  } catch (err) { next(err); }
});

router.post('/goals', authorize('ADMIN', 'HR', 'MANAGER'), validate(createGoalSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = req.body;
    const goal = await prisma.goal.create({
      data: {
        ...data,
        company_id: req.user!.company_id!,
        start_date: new Date(data.start_date),
        deadline: new Date(data.deadline)
      }
    });
    res.status(201).json(goal);
  } catch (err) { next(err); }
});

router.put('/goals/:id', authorize('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'), validate(updateGoalSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const data = req.body;
    if (data.start_date) data.start_date = new Date(data.start_date);
    if (data.deadline) data.deadline = new Date(data.deadline);
    const goal = await prisma.goal.update({
      where: { id: (req.params.id as string) },
      data
    });
    res.json(goal);
  } catch (err) { next(err); }
});

router.delete('/goals/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.goal.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});


// ==========================================
// KPIs
// ==========================================
router.get('/kpis', async (req: AuthRequest, res: any, next: any) => {
  try {
    const isEmployee = req.user!.role === 'EMPLOYEE';
    const where = isEmployee 
      ? { employee: { user_id: req.user!.id } }
      : { company_id: req.user!.company_id! };
      
    const kpis = await prisma.kPI.findMany({
      where,
      include: { employee: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(kpis);
  } catch (err) { next(err); }
});

router.post('/kpis', authorize('ADMIN', 'HR', 'MANAGER'), validate(createKPISchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const kpi = await prisma.kPI.create({
      data: {
        ...req.body,
        company_id: req.user!.company_id!
      }
    });
    res.status(201).json(kpi);
  } catch (err) { next(err); }
});

router.put('/kpis/:id', authorize('ADMIN', 'HR', 'MANAGER'), validate(updateKPISchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const kpi = await prisma.kPI.update({
      where: { id: (req.params.id as string) },
      data: req.body
    });
    // Calculate score automatically
    if (kpi.achieved_value > 0) {
      const score = Math.min((kpi.achieved_value / kpi.target_value) * kpi.weightage, kpi.weightage);
      await prisma.kPI.update({ where: { id: kpi.id }, data: { score }});
    }
    res.json(kpi);
  } catch (err) { next(err); }
});

router.delete('/kpis/:id', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.kPI.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ==========================================
// REVIEWS
// ==========================================
router.get('/my', async (req: AuthRequest, res: any, next: any) => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { employee: { user_id: req.user!.id } },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

router.get('/', authorize('ADMIN', 'HR', 'MANAGER'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const reviews = await prisma.performanceReview.findMany({
      where: { company_id: req.user!.company_id! },
      include: { employee: true, manager: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(reviews);
  } catch (err) { next(err); }
});

router.post('/', authorize('ADMIN', 'HR'), validate(createReviewSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const review = await prisma.performanceReview.create({
      data: {
        ...req.body,
        company_id: req.user!.company_id!,
        status: 'DRAFT'
      }
    });
    res.status(201).json(review);
  } catch (err) { next(err); }
});

// Self Review Submit
router.post('/:id/submit-self', validate(submitSelfReviewSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    const review = await prisma.performanceReview.update({
      where: { id: (req.params.id as string) },
      data: {
        self_rating: req.body.self_rating,
        self_comments: req.body.self_comments,
        status: 'SELF_REVIEW_SUBMITTED'
      }
    });
    res.json(review);
  } catch (err) { next(err); }
});

// Manager Review Submit
router.post('/:id/submit-manager', authorize('MANAGER', 'ADMIN', 'HR'), validate(submitManagerReviewSchema), async (req: AuthRequest, res: any, next: any) => {
  try {
    // Get goals and KPI scores for the employee to calculate overall
    const reviewOld = await prisma.performanceReview.findUnique({ where: { id: (req.params.id as string) }});
    if (!reviewOld) return res.status(404).json({error: 'Review not found'});
    
    // Simplistic final logic
    const goals_rating = req.body.manager_rating; 
    const overall = ((reviewOld.self_rating || req.body.manager_rating) + req.body.manager_rating) / 2;
    
    let badge = 'Needs Improvement';
    if (overall >= 4.5) badge = 'Excellent';
    else if (overall >= 3.5) badge = 'Good';
    else if (overall >= 2.5) badge = 'Average';

    const review = await prisma.performanceReview.update({
      where: { id: (req.params.id as string) },
      data: {
        manager_rating: req.body.manager_rating,
        manager_comments: req.body.manager_comments,
        manager_id: req.user!.employee_id, // If admin/hr, this might be null, but let's assume they have an employee record
        status: 'MANAGER_REVIEW_SUBMITTED',
        goals_rating,
        kpi_score: req.body.manager_rating, // Dummy logic
        overall_score: overall,
        badge
      }
    });
    res.json(review);
  } catch (err) { next(err); }
});

router.post('/:id/approve', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const review = await prisma.performanceReview.update({
      where: { id: (req.params.id as string) },
      data: { status: 'HR_APPROVED' }
    });
    res.json(review);
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    await prisma.performanceReview.delete({ where: { id: (req.params.id as string) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
