import prisma from '../lib/prisma.ts';

export class AttritionService {
  static calculateRiskScore(signals: any) {
    let score = 0;
    if (signals.low_performance) score += 30;
    if (signals.excessive_leaves) score += 20;
    if (signals.salary_stagnation) score += 25;
    if (signals.long_tenure) score += 10;
    if (signals.manager_changes) score += 15;
    if (signals.overtime_spikes) score += 20;

    let risk_level = 'LOW';
    if (score > 40 && score <= 70) risk_level = 'MEDIUM';
    if (score > 70) risk_level = 'HIGH';

    return { score: Math.min(score, 100), risk_level };
  }

  static async analyzeEmployee(employeeId: string, signals: any) {
    const { score, risk_level } = this.calculateRiskScore(signals);
    return await prisma.employeeAttritionScore.create({
      data: {
        employee_id: employeeId,
        score,
        risk_level,
        signals,
      }
    });
  }
}
