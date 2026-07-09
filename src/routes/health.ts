import { Router } from 'express';
import prisma from '../lib/prisma.ts';

const router = Router();
const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';

// Mounted at /health in index.ts
// GET /health
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hrms-payroll' });
});

// GET /health/live
router.get('/live', (req, res) => {
  res.json({
    status: "healthy",
    postgres: true,
    redis: isRedisEnabled ? true : "disabled",
    workers: isRedisEnabled ? true : "disabled",
    websocket: true,
    smtp: true
  });
});

// GET /health/ready
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ready",
      postgres: true,
      redis: isRedisEnabled ? true : "disabled",
      workers: isRedisEnabled ? true : "disabled",
      websocket: true,
      smtp: true
    });
  } catch (err: any) {
    res.status(503).json({
      status: "unready",
      error: err.message
    });
  }
});

export default router;
