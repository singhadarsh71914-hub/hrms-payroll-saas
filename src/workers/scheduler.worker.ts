import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import prisma from '../lib/prisma.ts';
import { addReportJob } from '../services/queue.service.ts';

const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';

const connection = isRedisEnabled ? new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => times > 3 ? null : Math.min(times * 50, 2000)
}) : null;
if (connection) {
  connection.on('error', (err) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('Redis error:', err.message);
});
}

export const schedulerWorker = isRedisEnabled ? new Worker('scheduler-queue', async (job: Job) => {
  try {
    const now = new Date();
    
    // Select all enabled reports where next_run_at is either null or past due
    const reports = await prisma.scheduledReport.findMany({
      where: {
        enabled: true,
        OR: [
          { next_run_at: { lte: now } },
          { next_run_at: null }
        ]
      }
    });

    for (const report of reports) {
      // Enqueue job
      await addReportJob(`scheduled_${report.id}_${now.getTime()}`, {
        company_id: report.company_id,
        report_type: report.report_type,
        format: 'pdf', // default or fetch from model if added
        recipients: report.recipients
      });

      // Calculate next_run_at based on frequency
      let nextRun = new Date(now);
      if (report.frequency === 'DAILY') {
        nextRun.setDate(now.getDate() + 1);
      } else if (report.frequency === 'WEEKLY') {
        nextRun.setDate(now.getDate() + 7);
      } else if (report.frequency === 'MONTHLY') {
        nextRun.setMonth(now.getMonth() + 1);
      } else {
        nextRun.setDate(now.getDate() + 1); // fallback
      }

      // Update report
      await prisma.scheduledReport.update({
        where: { id: report.id },
        data: {
          last_run_at: now,
          next_run_at: nextRun
        }
      });
    }
    return { executed: reports.length };
  } catch (error) {
    console.error('Scheduler error:', error);
    throw error;
  }
}, { connection: connection as any }) : { on: () => {} } as unknown as Worker;

schedulerWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('schedulerWorker error:', err.message);
});
