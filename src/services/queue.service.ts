import { Queue, QueueEvents } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const payrollQueue = new Queue('payroll-processing', { connection: connection as any });
export const pdfQueue = new Queue('pdf-generation', { connection: connection as any });
export const dlqQueue = new Queue('payroll-dlq', { connection: connection as any });

export const payrollQueueEvents = new QueueEvents('payroll-processing', { connection: connection as any });
export const pdfQueueEvents = new QueueEvents('pdf-generation', { connection: connection as any });

export const addPayrollJob = async (jobId: string, data: any) => {
  return payrollQueue.add(jobId, data, {
    jobId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true
  });
};

export const addPdfJob = async (jobId: string, data: any) => {
  return pdfQueue.add(jobId, data, {
    jobId,
    attempts: 5,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: true
  });
};

export const moveToDLQ = async (jobName: string, data: any, error: any) => {
  return dlqQueue.add(jobName, {
    ...data,
    error: error.message,
    stacktrace: error.stack,
    failed_at: new Date().toISOString()
  });
};
