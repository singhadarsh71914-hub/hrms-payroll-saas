// @ts-nocheck
import { logError } from '../utils/logError.ts';
import { Router } from 'express';
import { authLimiter, globalLimiter } from '../middleware/security.ts';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { payrollQueue, pdfQueue, dlqQueue, reportQueue } from '../services/queue.service.ts';
import { authorize } from '../middleware/auth.ts';

const router = Router();

router.post('/reset-rate-limit', (req, res, next) => {
  try {
    const ip = req.ip;
    if (typeof (authLimiter as any).resetKey === 'function') {
      (authLimiter as any).resetKey(ip);
      (authLimiter as any).resetKey('::1');
      (authLimiter as any).resetKey('127.0.0.1');
      (authLimiter as any).resetKey('::ffff:127.0.0.1');
    }
    if (typeof (globalLimiter as any).resetKey === 'function') {
      (globalLimiter as any).resetKey(ip);
      (globalLimiter as any).resetKey('::1');
    }
    res.json({ message: 'Rate limits have been reset successfully', resetIp: ip });
  } catch (err: any) {
    logError('ADMIN.TS', req, err);
    next(err);
  }
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/api/admin/queues');

const queues = [];
if (payrollQueue && typeof payrollQueue.add === 'function') {
  try {
    queues.push(
      new BullMQAdapter(payrollQueue),
      new BullMQAdapter(pdfQueue),
      new BullMQAdapter(dlqQueue),
      new BullMQAdapter(reportQueue)
    );
  } catch(e) {}
}

createBullBoard({
  queues,
  serverAdapter: serverAdapter,
});

router.use('/queues', serverAdapter.getRouter());

export default router;
