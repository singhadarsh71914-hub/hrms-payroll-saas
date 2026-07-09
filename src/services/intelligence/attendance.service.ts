import prisma from '../../lib/prisma.ts';
import { MetricsService } from '../metrics.service.ts';
import { AnomalyEngineService } from './anomaly.service.ts';

export class AttendanceIntelligenceService {
  /**
   * Statistical Burnout and Attendance Detection
   */
  static async calculateCompanyAttendanceMetrics(companyId: string) {
    const employees = await prisma.employee.findMany({
      where: { company_id: companyId, employment_status: 'ACTIVE' },
      include: {
        attendance: {
          where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        },
        leave_balances: true
      }
    });

    // Extract arrays for z-score baselines
    const overtimes = employees.map(e => e.attendance.reduce((sum, a) => sum + Number(a.over_time_hours || 0), 0));
    const absences = employees.map(e => e.attendance.filter(a => a.status === 'ABSENT').length);
    const leaveUsages = employees.map(e => e.leave_balances.reduce((sum, lb) => sum + (Number(lb.used_days) / (Number(lb.total_days) || 1)), 0));

    const otStats = AnomalyEngineService.getStats(overtimes);
    const absStats = AnomalyEngineService.getStats(absences);
    const leaveStats = AnomalyEngineService.getStats(leaveUsages);

    const metrics = [];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const empOt = overtimes[i];
      const empAbs = absences[i];
      const empLeave = leaveUsages[i];

      const zOt = AnomalyEngineService.getZScore(empOt, otStats.mean, otStats.stdDev);
      const zAbs = AnomalyEngineService.getZScore(empAbs, absStats.mean, absStats.stdDev);
      const zLeave = AnomalyEngineService.getZScore(empLeave, leaveStats.mean, leaveStats.stdDev);

      // Burnout Index (composite z-score)
      const burnoutIndex = zOt + zAbs - zLeave; // High OT, High Abs, Low Leave usage = Burnout
      
      let burnoutRisk = 'LOW';
      if (burnoutIndex > 4) burnoutRisk = 'CRITICAL';
      else if (burnoutIndex > 2) burnoutRisk = 'HIGH';
      else if (burnoutIndex > 1) burnoutRisk = 'MEDIUM';

      // Record Metric
      if (burnoutRisk !== 'LOW') {
        MetricsService.increment('burnout_scores_total', { level: burnoutRisk });
      }

      // Detect Spikes / Anomalies (3-sigma rule)
      if (zOt > 3) {
        await AnomalyEngineService.persistAnomaly({
          company_id: companyId,
          employee_id: emp.id,
          type: 'OVERTIME_SURGE',
          severity: 'HIGH',
          message: `Employee has extreme overtime (${empOt} hrs, z-score: ${zOt.toFixed(2)})`
        });
      }
      
      if (zAbs > 3) {
        await AnomalyEngineService.persistAnomaly({
          company_id: companyId,
          employee_id: emp.id,
          type: 'ABNORMAL_ABSENTEEISM',
          severity: 'HIGH',
          message: `Employee has critical absenteeism (${empAbs} days, z-score: ${zAbs.toFixed(2)})`
        });
      }

      // Map to old output shape for compatibility
      metrics.push({
        employee_id: emp.id,
        absenteeism_score: Math.min(100, Math.max(0, empAbs * 10)),
        late_arrival_score: emp.attendance.filter(a => a.status === 'HALF_DAY').length * 5,
        overtime_risk: burnoutRisk, // Using burnout risk here as generic high-risk indicator
        burnout_indicators: burnoutRisk,
        attendance_trends: {
          total_absent: empAbs,
          total_late: emp.attendance.filter(a => a.status === 'HALF_DAY').length,
          total_overtime: empOt
        }
      });
    }

    return metrics;
  }
}
