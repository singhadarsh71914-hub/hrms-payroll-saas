import prisma from '../../lib/prisma.ts';
import { MetricsService } from '../metrics.service.ts';
import { AnomalyEngineService } from './anomaly.service.ts';

export class AttritionIntelligenceService {
  /**
   * Statistical Attrition Prediction Model V2
   */
  static async calculateAttritionPredictions(companyId: string) {
    const employees = await prisma.employee.findMany({
      where: { company_id: companyId, employment_status: 'ACTIVE' },
      include: {
        salaries: { orderBy: { effective_from: 'asc' } },
        attendance: {
          where: { date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        },
        leave_requests: {
          where: { status: 'APPROVED' }
        }
      }
    });

    const predictions = [];

    // Precompute attendance stats for anomaly detection
    const companyAbsenteeism = employees.map(e => e.attendance.filter(a => a.status === 'ABSENT').length);
    const { mean: absMean, stdDev: absStd } = AnomalyEngineService.getStats(companyAbsenteeism);

    for (const emp of employees) {
      let riskScore = 0;
      let confidence = 50;
      const reasons: string[] = [];

      // 1. Tenure
      const tenureMonths = (Date.now() - new Date(emp.date_of_joining).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (tenureMonths < 6) {
        riskScore += 20;
        reasons.push('High flight risk in early tenure phase');
        confidence += 10;
      } else if (tenureMonths > 36) {
        riskScore -= 10; // More stable
        confidence += 20;
      }

      // 2. Salary Growth
      if (emp.salaries.length > 0) {
        const firstSalary = Number(emp.salaries[0].ctc_monthly);
        const lastSalary = Number(emp.salaries[emp.salaries.length - 1].ctc_monthly);
        const growth = (lastSalary - firstSalary) / firstSalary;
        if (growth < 0.05 && tenureMonths > 12) {
          riskScore += 25;
          reasons.push('Low salary growth relative to tenure');
          confidence += 15;
        } else if (growth > 0.20) {
          riskScore -= 15;
        }
      } else {
        confidence -= 10;
      }

      // 3. Absenteeism (Statistical Anomaly)
      const absents = emp.attendance.filter(a => a.status === 'ABSENT').length;
      const absZ = AnomalyEngineService.getZScore(absents, absMean, absStd);
      if (absZ > 2) {
        riskScore += 25;
        reasons.push(`Abnormally high absenteeism (z-score: ${absZ.toFixed(2)})`);
        confidence += 10;
      }

      // 4. Overtime
      const totalOvertime = emp.attendance.reduce((sum, a) => sum + Number(a.over_time_hours || 0), 0);
      if (totalOvertime > 40) { // arbitrary threshold for 90 days
        riskScore += 15;
        reasons.push('Consistent high overtime detected');
      }

      // Bound score and confidence
      riskScore = Math.max(0, Math.min(100, riskScore));
      confidence = Math.max(0, Math.min(100, confidence));
      
      let riskLevel = 'LOW';
      if (riskScore > 75) riskLevel = 'HIGH';
      else if (riskScore > 50) riskLevel = 'MEDIUM';

      predictions.push({
        employee_id: emp.id,
        attrition_risk: riskLevel,
        risk_score: riskScore,
        confidence,
        reasons
      });

      // Also persist to DB as EmployeeAttritionScore for legacy compatibility if needed
      await prisma.employeeAttritionScore.create({
        data: {
          employee_id: emp.id,
          score: riskScore,
          risk_level: riskLevel,
          signals: reasons
        }
      });
      
      MetricsService.increment('attrition_predictions_total');
    }

    return predictions;
  }
}
