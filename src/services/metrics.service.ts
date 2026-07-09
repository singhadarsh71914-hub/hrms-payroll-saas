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

export const analyticsQueryDurationMs = new promClient.Histogram({ name: 'analytics_query_duration_ms', help: 'Duration of analytics queries' });
export const reportGenerationDurationMs = new promClient.Histogram({ name: 'report_generation_duration_ms', help: 'Duration of report generation' });
export const dashboardLoadDurationMs = new promClient.Histogram({ name: 'dashboard_load_duration_ms', help: 'Duration of dashboard loading' });
export const executiveExportsTotal = new promClient.Counter({ name: 'executive_exports_total', help: 'Total executive reports exported' });

export const workforcePredictionsTotal = new promClient.Counter({ name: 'workforce_predictions_total', help: 'Total workforce predictions' });
export const attritionJobsTotal = new promClient.Counter({ name: 'attrition_jobs_total', help: 'Total attrition jobs processed' });
export const forecastDurationMs = new promClient.Histogram({ name: 'forecast_duration_ms', help: 'Duration of payroll forecast in ms' });
export const aiDashboardLoadMs = new promClient.Histogram({ name: 'ai_dashboard_load_ms', help: 'Duration of AI dashboard load in ms' });


export const intelligenceSnapshotsTotal = new promClient.Counter({ name: 'intelligence_snapshots_total', help: 'Total intelligence snapshots created', labelNames: ['type', 'company_id'] });
export const burnoutPredictionsTotal = new promClient.Counter({ name: 'burnout_predictions_total', help: 'Total burnout predictions made' });
export const attritionPredictionsTotal = new promClient.Counter({ name: 'attrition_predictions_total', help: 'Total attrition predictions made' });
export const anomaliesDetectedTotal = new promClient.Counter({ name: 'anomalies_detected_total', help: 'Total anomalies detected', labelNames: ['type', 'severity'] });
export const featureStoreReadsTotal = new promClient.Counter({ name: 'feature_store_reads_total', help: 'Total feature store reads', labelNames: ['type', 'company_id'] });

export const MetricsService = {
    increment: (metric: string, labels?: Record<string, string>) => {
      switch(metric) {
        case 'intelligence_snapshots_total': intelligenceSnapshotsTotal.labels(labels || {}).inc(); break;
        case 'burnout_predictions_total': burnoutPredictionsTotal.inc(); break;
        case 'attrition_predictions_total': attritionPredictionsTotal.inc(); break;
        case 'anomalies_detected_total': anomaliesDetectedTotal.labels(labels || {}).inc(); break;
        case 'feature_store_reads_total': featureStoreReadsTotal.labels(labels || {}).inc(); break;
      }
    },
    recordHistogram: (metric: string, val: number) => {
      // just a placeholder if needed
    },
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
  observeAnalyticsQueryDuration: (ms: number) => analyticsQueryDurationMs.observe(ms),
  observeReportGenerationDuration: (ms: number) => reportGenerationDurationMs.observe(ms),
  observeDashboardLoadDuration: (ms: number) => dashboardLoadDurationMs.observe(ms),
  incrementExecutiveExports: () => executiveExportsTotal.inc(),
  incrementWorkforcePredictions: () => workforcePredictionsTotal.inc(),
  incrementAttritionJobs: () => attritionJobsTotal.inc(),
  observeForecastDuration: (ms: number) => forecastDurationMs.observe(ms),
  observeAiDashboardLoad: (ms: number) => aiDashboardLoadMs.observe(ms),
};
