import promClient from 'prom-client';

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics();

export const payrollDurationMs = new promClient.Histogram({
  name: 'payroll_duration_ms',
  help: 'Duration of payroll processing in ms',
  buckets: [100, 500, 1000, 5000, 10000, 60000]
});

export const pdfGenerationMs = new promClient.Histogram({
  name: 'pdf_generation_ms',
  help: 'Duration of PDF generation in ms',
  buckets: [50, 100, 500, 1000]
});

export const workerFailuresTotal = new promClient.Counter({
  name: 'worker_failures_total',
  help: 'Total worker failures'
});

export const payrollJobsTotal = new promClient.Counter({
  name: 'payroll_jobs_total',
  help: 'Total payroll jobs queued'
});

export const payrollJobsRunning = new promClient.Gauge({
  name: 'payroll_jobs_running',
  help: 'Currently running payroll jobs'
});

export const payrollJobsFailed = new promClient.Counter({
  name: 'payroll_jobs_failed',
  help: 'Total payroll jobs failed completely'
});

export const payrollJobsCompleted = new promClient.Counter({
  name: 'payroll_jobs_completed',
  help: 'Total payroll jobs completed successfully'
});

export const redisQueueSize = new promClient.Gauge({
  name: 'redis_queue_size',
  help: 'Number of jobs in redis queues'
});

export const dbQueryCount = new promClient.Counter({
  name: 'db_query_count',
  help: 'Number of database queries executed'
});

export const MetricsService = {
  getMetrics: async () => {
    return await promClient.register.metrics();
  },
  observePayrollDuration: (ms: number) => payrollDurationMs.observe(ms),
  observePdfGenerationDuration: (ms: number) => pdfGenerationMs.observe(ms),
  incrementWorkerFailures: () => workerFailuresTotal.inc(),
  incrementPayrollJobsTotal: () => payrollJobsTotal.inc(),
  incrementPayrollJobsRunning: () => payrollJobsRunning.inc(),
  decrementPayrollJobsRunning: () => payrollJobsRunning.dec(),
  incrementPayrollJobsFailed: () => payrollJobsFailed.inc(),
  incrementPayrollJobsCompleted: () => payrollJobsCompleted.inc(),
  setRedisQueueSize: (size: number) => redisQueueSize.set(size),
  incrementDbQueryCount: (count: number = 1) => dbQueryCount.inc(count),
};
