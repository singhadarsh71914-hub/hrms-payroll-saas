import prisma from '../../lib/prisma.ts';
import { MetricsService } from '../metrics.service.ts';

export class AnomalyEngineService {
  /**
   * Calculate standard deviation and mean for an array of numbers
   */
  static getStats(values: number[]) {
    if (values.length === 0) return { mean: 0, stdDev: 0 };
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  /**
   * Calculate z-score
   */
  static getZScore(value: number, mean: number, stdDev: number) {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /**
   * Persist a new anomaly
   */
  static async persistAnomaly(data: {
    company_id: string;
    employee_id?: string;
    department_id?: string;
    type: string;
    severity: string;
    message: string;
    metadata?: any;
  }) {
    const result = await prisma.intelligenceAnomaly.create({
      data: {
        company_id: data.company_id,
        employee_id: data.employee_id,
        department_id: data.department_id,
        type: data.type,
        severity: data.severity,
        message: data.message,
        metadata: data.metadata || {}
      }
    });

    MetricsService.increment('anomalies_detected_total', { type: data.type, severity: data.severity });
    return result;
  }

  /**
   * Scan payroll for anomalies (3-sigma rule)
   */
  static async scanPayrollSpikes(companyId: string) {
    // Get historical payroll runs
    const runs = await prisma.payrollRun.findMany({
      where: { company_id: companyId, status: 'COMPLETED' },
      orderBy: { created_at: 'asc' }
    });

    if (runs.length < 3) return []; // Not enough data for stats

    const totals = runs.map(r => Number(r.total_company_cost));
    const { mean, stdDev } = this.getStats(totals.slice(0, totals.length - 1));
    const latestTotal = totals[totals.length - 1];
    const latestRun = runs[runs.length - 1];

    const zScore = this.getZScore(latestTotal, mean, stdDev);
    
    // 3-sigma rule
    if (Math.abs(zScore) >= 3) {
      await this.persistAnomaly({
        company_id: companyId,
        type: 'PAYROLL_SPIKE',
        severity: zScore > 4 ? 'CRITICAL' : 'HIGH',
        message: `Abnormal payroll amount detected: ${latestTotal}. Expected around ${Math.round(mean)}.`,
        metadata: { zScore, mean, stdDev, latestTotal, run_id: latestRun.id }
      });
      return [{ type: 'PAYROLL_SPIKE', zScore }];
    }
    return [];
  }
}
