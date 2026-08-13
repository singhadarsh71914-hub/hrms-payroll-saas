import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import prisma from '../lib/prisma.ts';
import { FeatureStoreService } from '../services/intelligence/feature-store.service.ts';
import { AttendanceIntelligenceService } from '../services/intelligence/attendance.service.ts';
import { AttritionIntelligenceService } from '../services/intelligence/attrition.service.ts';
import { PayrollForecastService } from '../services/intelligence/payroll-forecast.service.ts';
import { AnomalyEngineService } from '../services/intelligence/anomaly.service.ts';

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

export const snapshotWorker = isRedisEnabled ? new Worker('workforce-snapshot', async (job) => {
  
  // Get all companies
  const companies = await prisma.company.findMany({ select: { id: true } });
  const snapshot_date = new Date();
  
  for (const c of companies) {
    const companyId = c.id;
    
    // Anomaly Engine sweeps
    const payrollAnomalies = await AnomalyEngineService.scanPayrollSpikes(companyId);
    
    // Calculate full company data
    const attrition = await AttritionIntelligenceService.calculateAttritionPredictions(companyId);
    const attendance = await AttendanceIntelligenceService.calculateCompanyAttendanceMetrics(companyId);
    const forecast = await PayrollForecastService.forecastCompanyPayroll(companyId);
    
    // Average scores
    const avgAttrition = attrition.reduce((a: any, b: any) => a + (b.risk_score || 0), 0) / (attrition.length || 1);
    const avgAttendanceScore = attendance.reduce((a: any, b: any) => a + (b.absenteeism_score || 0), 0) / (attendance.length || 1);
    
    // Aggregate persistent anomalies for this run
    const recentAnomalies = await prisma.intelligenceAnomaly.findMany({
      where: { company_id: companyId, resolved_at: null, created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    });
    
    const companyRecommendations: { type: string; message: string }[] = [];
    if (avgAttrition > 50) companyRecommendations.push({ type: 'RETENTION', message: `Avg attrition risk elevated (${avgAttrition.toFixed(1)}). Schedule retention interviews.` });
    if (avgAttendanceScore > 40) companyRecommendations.push({ type: 'ATTENDANCE', message: `Above-average absenteeism. Consider workforce wellness initiatives.` });
    if (payrollAnomalies.length > 0) companyRecommendations.push({ type: 'PAYROLL', message: `Payroll spike detected. Audit latest payroll run.` });
    if (companyRecommendations.length === 0) companyRecommendations.push({ type: 'STATUS', message: 'All metrics within normal range. No action required.' });

    const productivityScore = attendance.length > 0
      ? Math.max(0, 100 - (attendance.filter((a: any) => a.overtime_risk !== 'LOW').length / attendance.length) * 100)
      : 100;

    // Save company snapshot
    await FeatureStoreService.saveCompanySnapshot({
      company_id: companyId,
      snapshot_date,
      attrition_risk: avgAttrition > 75 ? 'HIGH' : avgAttrition > 50 ? 'MEDIUM' : 'LOW',
      burnout_risk: avgAttendanceScore > 80 ? 'HIGH' : avgAttendanceScore > 40 ? 'MEDIUM' : 'LOW',
      attendance_score: Math.max(0, 100 - avgAttendanceScore),
      productivity_score: productivityScore,
      overtime_risk: attendance.some((a: any) => a.overtime_risk === 'HIGH' || a.overtime_risk === 'CRITICAL') ? 'HIGH' : 'MEDIUM',
      forecast_payload: forecast,
      anomalies: [...payrollAnomalies, ...recentAnomalies.map((a: any) => ({ type: a.type, message: a.message, severity: a.severity }))],
      recommendations: companyRecommendations
    });
    
    // Department / employee loops (Top 10 risks)
    const sortedAttrition = [...attrition].sort((a: any, b: any) => b.risk_score - a.risk_score);
    const topRisks = sortedAttrition.slice(0, 10);
    
    for (const risk of topRisks) {
      // Find matching attendance for employee
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
  }
  
}, { connection: connection as any, concurrency: 1 }) : { on: () => {} } as unknown as Worker;

snapshotWorker.on('failed', (job, err) => {
  console.error(`Snapshot job failed:`, err);
});

snapshotWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('snapshotWorker error:', err.message);
});
