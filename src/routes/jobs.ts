import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.ts';
import { AppError } from '../middleware/error.ts';
import { payrollQueue } from '../services/queue.service.ts';
import { MetricsService } from '../services/metrics.service.ts';
import prisma from '../lib/prisma.ts';

const router = Router();

// GET /metrics
router.get('/metrics', async (req, res, next) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.send(await MetricsService.getMetrics());
  } catch (err) {
    next(err);
  }
});

router.use(authenticate);

// POST /api/jobs/:id/cancel
router.post('/jobs/:id/cancel', authorize('ADMIN', 'HR'), async (req: AuthRequest, res: any, next: any) => {
  try {
    const job = await prisma.payrollJob.findUnique({ where: { id: req.params.id as string } });
    
    if (!job) return next(new AppError('Job not found', 404));

    if (job.status === 'COMPLETED' || job.status === 'LOCKED') {
      return next(new AppError('Job cannot be cancelled', 409));
    }

    if (job.status === 'QUEUED' || job.status === 'RUNNING') {
      // Find the bullmq job and remove or gracefully stop
      const bullJob = await payrollQueue.getJob(job.id);
      if (bullJob) {
        // BullMQ does not support forced abort of running workers out of the box,
        // but removing it from the queue cancels if it's QUEUED or delayed.
        await bullJob.remove();
      }

      await prisma.payrollJob.update({
        where: { id: job.id },
        data: { status: 'CANCELLED' }
      });
    }

    res.json({ message: 'Job cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
