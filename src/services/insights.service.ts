export class InsightsService {
  static generateInsights(data: any) {
    const insights = [];
    
    // Deterministic rules mapping metrics into textual insights
    if (data.overtimeIncrease > 20) {
      insights.push(`Engineering overtime increased ${data.overtimeIncrease}% this quarter.`);
    }
    
    if (data.attritionRisk > data.companyAverageAttrition) {
      insights.push(`Sales attrition risk is above company average.`);
    }
    
    if (data.femaleLeadershipIncrease > 5) {
      insights.push(`Female leadership representation improved by ${data.femaleLeadershipIncrease}%.`);
    }
    
    if (data.payrollProjectedIncrease > 100000) {
      insights.push(`Payroll expenses projected to increase by ₹${(data.payrollProjectedIncrease / 100000).toFixed(0)}L next quarter.`);
    }

    return insights;
  }
}
