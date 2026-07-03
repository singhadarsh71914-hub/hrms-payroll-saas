import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { moveToDLQ } from '../services/queue.service.ts';
import { MetricsService } from '../services/metrics.service.ts';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const pdfWorker = new Worker('pdf-generation', async (job: Job) => {
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
}, { connection: connection as any });

pdfWorker.on('failed', async (job: Job | undefined, err: Error) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 5)) {
    await moveToDLQ('pdf-generation', job.data, err);
  }
});
