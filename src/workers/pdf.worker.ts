import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { moveToDLQ } from '../services/queue.service.ts';
import { MetricsService } from '../services/metrics.service.ts';

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

export const pdfWorker = isRedisEnabled ? new Worker('pdf-generation', async (job: Job) => {
  const { payslipId } = job.data;
  
  const startTime = Date.now();

  try {
    // Mocking PDF generation
    await new Promise(r => setTimeout(r, 20)); 
    
    MetricsService.observePdfGenerationDuration(Date.now() - startTime);
  } catch (error: any) {
    MetricsService.incrementWorkerFailures();
    throw error;
  }
}, { connection: connection as any }) : { on: () => {} } as unknown as Worker;

pdfWorker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
    await moveToDLQ('pdf-generation', job.data, err);
  }
});

pdfWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('pdfWorker error:', err.message);
});
