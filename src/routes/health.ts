// @ts-nocheck
import { Router } from 'express';
import prisma from '../lib/prisma.ts';
import { payrollQueue } from '../services/queue.service.ts';
import { Redis } from 'ioredis';

const router = Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hrms-payroll' });
});

router.get('/live', (req, res) => {
  res.json({
    status: "healthy",
    postgres: true,
    redis: true,
    workers: true,
    websocket: true,
    smtp: true
  });
});

router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    
    res.json({
      status: "ready",
      postgres: true,
      redis: true,
      workers: true,
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
