import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { AttendanceIntelligenceService } from '../services/intelligence/attendance.service.ts';
import { AttritionIntelligenceService } from '../services/intelligence/attrition.service.ts';
import { PayrollForecastService } from '../services/intelligence/payroll-forecast.service.ts';
import { FeatureStoreService } from '../services/intelligence/feature-store.service.ts';
import { AnomalyEngineService } from '../services/intelligence/anomaly.service.ts';
import { MetricsService } from '../services/metrics.service.ts';
import prisma from '../lib/prisma.ts';

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

export const processWorkforceIntelligenceJob = async (data: { companyId: string, type: string }) => {
  const { companyId, type } = data;
  try {
    const snapshot_date = new Date();

    // Step 1: compute all metrics
    const attendance = (type === 'ALL' || type === 'ATTENDANCE')
      ? await AttendanceIntelligenceService.calculateCompanyAttendanceMetrics(companyId)
      : [];

    const attrition = (type === 'ALL' || type === 'ATTRITION')
      ? await AttritionIntelligenceService.calculateAttritionPredictions(companyId)
      : [];

    if (type === 'ALL' || type === 'ATTRITION') {
      MetricsService.incrementAttritionJobs();
    }

    const forecast = (type === 'ALL' || type === 'FORECAST')
      ? await PayrollForecastService.forecastCompanyPayroll(companyId)
      : { predicted_next_month: 0, confidence_interval: { lower: 0, upper: 0 }, quarterly_projection: 0, hiring_impact: 0, trend_multiplier: 1.0 };

    // Step 2: aggregate company-level scores
    const avgAttrition = attrition.length > 0
      ? attrition.reduce((a: any, b: any) => a + (b.risk_score || 0), 0) / attrition.length
      : 0;
    const avgAttendanceScore = attendance.length > 0
      ? attendance.reduce((a: any, b: any) => a + (b.absenteeism_score || 0), 0) / attendance.length
      : 0;

    // Step 3: scan payroll anomalies
    const payrollAnomalies = await AnomalyEngineService.scanPayrollSpikes(companyId);

    // Step 4: collect recent unresolved anomalies
    const recentAnomalies = await prisma.intelligenceAnomaly.findMany({
      where: { company_id: companyId, resolved_at: null, created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    });

    // Step 5: build data-driven recommendations
    const recommendations: { type: string; message: string }[] = [];
    if (avgAttrition > 50) recommendations.push({ type: 'RETENTION', message: `High attrition risk detected (avg score: ${avgAttrition.toFixed(1)}). Schedule retention interviews.` });
    if (avgAttendanceScore > 40) recommendations.push({ type: 'ATTENDANCE', message: `Elevated absenteeism detected. Consider wellness check-ins.` });
    if (payrollAnomalies.length > 0) recommendations.push({ type: 'PAYROLL', message: `Payroll spike detected. Review latest payroll run for anomalies.` });
    if (recommendations.length === 0) recommendations.push({ type: 'STATUS', message: 'All metrics within normal range. No action required.' });

    // Step 6: persist company snapshot to FeatureStore
    await FeatureStoreService.saveCompanySnapshot({
      company_id: companyId,
      snapshot_date,
      attrition_risk: avgAttrition > 75 ? 'HIGH' : avgAttrition > 50 ? 'MEDIUM' : 'LOW',
      burnout_risk: avgAttendanceScore > 80 ? 'HIGH' : avgAttendanceScore > 40 ? 'MEDIUM' : 'LOW',
      attendance_score: Math.max(0, 100 - avgAttendanceScore),
      productivity_score: attendance.length > 0
        ? Math.max(0, 100 - (attendance.filter((a: any) => a.overtime_risk !== 'LOW').length / attendance.length) * 100)
        : 100,
      overtime_risk: attendance.some((a: any) => a.overtime_risk === 'HIGH' || a.overtime_risk === 'CRITICAL') ? 'HIGH' : 'LOW',
      forecast_payload: forecast,
      anomalies: [...payrollAnomalies, ...recentAnomalies.map((a: any) => ({ type: a.type, message: a.message, severity: a.severity }))],
      recommendations
    });

    // Step 7: persist top employee risk snapshots
    const sortedAttrition = [...attrition].sort((a: any, b: any) => b.risk_score - a.risk_score).slice(0, 10);
    for (const risk of sortedAttrition) {
      const empAtt = attendance.find((a: any) => a.employee_id === risk.employee_id) || { absenteeism_score: 0, overtime_risk: 'LOW', burnout_indicators: 'LOW' };
      const empAnomalies = recentAnomalies.filter((a: any) => a.employee_id === risk.employee_id);

      await FeatureStoreService.saveEmployeeSnapshot({
        company_id: companyId,
        employee_id: risk.employee_id,
        snapshot_date,
        attrition_risk: risk.attrition_risk || 'LOW',
        burnout_risk: empAtt.burnout_indicators || 'LOW',
        attendance_score: Math.max(0, 100 - (empAtt.absenteeism_score || 0)),
        productivity_score: empAtt.overtime_risk === 'HIGH' ? 60 : empAtt.overtime_risk === 'MEDIUM' ? 80 : 95,
        overtime_risk: empAtt.overtime_risk || 'LOW',
        anomalies: [...risk.reasons, ...empAnomalies.map((a: any) => ({ type: a.type, message: a.message, severity: a.severity }))],
        recommendations: risk.risk_score > 50
          ? [{ type: 'RETENTION', message: `Schedule 1-on-1. Risk score: ${risk.risk_score}` }]
          : []
      });
    }

    return { success: true, companyId };
  } catch (error: any) {
    console.error(`Intelligence Worker Error (Company: ${companyId}):`, error);
    MetricsService.incrementWorkerFailures();
    throw error;
  }
};

export const intelligenceWorker = isRedisEnabled ? new Worker('workforce-intelligence', async (job: Job) => {
  return await processWorkforceIntelligenceJob(job.data as any);
}, {
  connection: connection as any,
  concurrency: 2 // Allow concurrent processing
}) : { on: () => {} } as unknown as Worker;

intelligenceWorker.on('completed', (job) => {
});

intelligenceWorker.on('failed', (job, err) => {
  console.error(`[Intelligence Worker] Failed job ${job?.id}:`, err);
});

intelligenceWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('intelligenceWorker error:', err.message);
});
