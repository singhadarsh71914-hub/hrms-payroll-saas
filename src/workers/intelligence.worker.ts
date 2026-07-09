import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { AttendanceIntelligenceService } from '../services/intelligence/attendance.service.ts';
import { AttritionIntelligenceService } from '../services/intelligence/attrition.service.ts';
import { PayrollForecastService } from '../services/intelligence/payroll-forecast.service.ts';
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

export const intelligenceWorker = isRedisEnabled ? new Worker('workforce-intelligence', async (job: Job) => {
  const { companyId, type } = job.data;
  
  try {
    if (type === 'ALL' || type === 'ATTENDANCE') {
      await AttendanceIntelligenceService.calculateCompanyAttendanceMetrics(companyId);
    }
    
    if (type === 'ALL' || type === 'ATTRITION') {
      await AttritionIntelligenceService.calculateAttritionPredictions(companyId);
      MetricsService.incrementAttritionJobs();
    }
    
    if (type === 'ALL' || type === 'FORECAST') {
      await PayrollForecastService.forecastCompanyPayroll(companyId);
    }
    
    return { success: true, companyId };
  } catch (error: any) {
    console.error(`Intelligence Worker Error (Job: ${job.id}):`, error);
    MetricsService.incrementWorkerFailures();
    throw error;
  }
}, { 
  connection: connection as any,
  concurrency: 2 // Allow concurrent processing
}) : { on: () => {} } as unknown as Worker;

intelligenceWorker.on('completed', (job) => {
  console.log(`[Intelligence Worker] Completed job ${job.id}`);
});

intelligenceWorker.on('failed', (job, err) => {
  console.error(`[Intelligence Worker] Failed job ${job?.id}:`, err);
});

intelligenceWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('intelligenceWorker error:', err.message);
});
