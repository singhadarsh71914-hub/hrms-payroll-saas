import { Queue, QueueEvents } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

const isRedisEnabled = process.env.ENABLE_REDIS !== 'false';

export const connection = isRedisEnabled ? new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) return null; // stop retrying
    return Math.min(times * 50, 2000);
  }
}) : null;

if (connection) {
  connection.on('error', (err: any) => {
    if (err.code !== 'ECONNREFUSED') {
      console.error('Redis error:', err.message);
    }
  });
}

const createQueue = (name: string) => {
  if (!isRedisEnabled) {
    return {
      add: async () => ({ id: 'mock' }),
      on: () => {}
    } as unknown as Queue;
  }
  return new Queue(name, { connection: connection as any });
};

export const payrollQueue = createQueue('payroll-processing');
export const pdfQueue = createQueue('pdf-generation');
export const dlqQueue = createQueue('payroll-dlq');
export const reportQueue = createQueue('report-generation');
export const schedulerQueue = createQueue('scheduler-queue');
export const workforceIntelligenceQueue = createQueue('workforce-intelligence');
export const workforceSnapshotQueue = createQueue('workforce-snapshot');

// Initialize repeatable jobs
const allQueues = [payrollQueue, pdfQueue, dlqQueue, reportQueue, schedulerQueue, workforceIntelligenceQueue, workforceSnapshotQueue];
allQueues.forEach(q => {
  if (isRedisEnabled) {
    q.on('error', (err: any) => {
      if (err.code !== 'ECONNREFUSED') console.error('Queue error:', err.message);
    });
  }
});

if (isRedisEnabled) {
  schedulerQueue.add('run-scheduler', {}, {
    repeat: {
      pattern: '* * * * *' // Every minute
    },
    removeOnComplete: true,
    removeOnFail: 10
  });

  workforceSnapshotQueue.add('run-snapshot', {}, {
    repeat: {
      pattern: '0 2 * * *' // Every day at 2 AM
    },
    removeOnComplete: true,
    removeOnFail: 10
  });
}



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

export const addReportJob = async (jobId: string, data: any) => {
  return reportQueue.add(jobId, data, {
    jobId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true
  });
};

export const addIntelligenceJob = async (jobName: string, data: any) => {
  return workforceIntelligenceQueue.add(jobName, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true
  });
};

export const addWorkforceIntelligenceJob = async (companyId: string, employeeId?: string) => {
  return workforceIntelligenceQueue.add('analyze', { companyId, employeeId }, { removeOnComplete: true });
};

export const addWorkforceSnapshotJob = async () => {
  return workforceSnapshotQueue.add('snapshot', {}, { removeOnComplete: true });
};

export const moveToDLQ = async (jobName: string, data: any, error: any) => {
  return dlqQueue.add(jobName, {
    ...data,
    error: error.message,
    stacktrace: error.stack,
    failed_at: new Date().toISOString()
  });
};
