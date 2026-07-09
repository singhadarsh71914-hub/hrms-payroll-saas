import prisma from '../../lib/prisma.ts';
import { MetricsService } from '../metrics.service.ts';
import { AnomalyEngineService } from './anomaly.service.ts';

export class PayrollForecastService {
  /**
   * Calculate Weighted Moving Average (WMA)
   */
  static calculateWMA(values: number[], periods: number): number {
    if (values.length === 0) return 0;
    const slice = values.slice(-periods);
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < slice.length; i++) {
      const weight = i + 1;
      weightedSum += slice[i] * weight;
      weightSum += weight;
    }
    
    return weightedSum / weightSum;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  static calculateEMA(values: number[], periods: number): number {
    if (values.length === 0) return 0;
    const k = 2 / (periods + 1);
    let ema = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema = (values[i] * k) + (ema * (1 - k));
    }
    
    return ema;
  }

  /**
   * Statistical Payroll Forecasting
   */
  static async forecastCompanyPayroll(companyId: string) {
    const start = Date.now();
    try {
      const pastRuns = await prisma.payrollRun.findMany({
        where: { company_id: companyId, status: 'COMPLETED' },
        orderBy: { created_at: 'asc' },
        take: 24 // Up to 2 years of data
      });

      const totals = pastRuns.map(r => Number(r.total_company_cost));
      
      let predicted_next_month = 0;
      let quarterly_projection = 0;
      let confidence_interval = { lower: 0, upper: 0 };
      let hiring_impact = 0;
      
      if (totals.length > 0) {
        // Compute WMA and EMA
        const wma = this.calculateWMA(totals, Math.min(6, totals.length));
        const ema = this.calculateEMA(totals, Math.min(6, totals.length));
        
        // Base prediction on EMA
        predicted_next_month = ema;
        
        // Calculate Confidence Interval (95% CI -> 1.96 * stdDev)
        const { mean, stdDev } = AnomalyEngineService.getStats(totals);
        const marginOfError = 1.96 * (stdDev / Math.sqrt(totals.length || 1));
        
        confidence_interval = {
          lower: predicted_next_month - marginOfError,
          upper: predicted_next_month + marginOfError
        };
        
        // Quarterly Projection (EMA with trend extrapolation)
        const trend = totals.length > 1 ? (totals[totals.length - 1] - totals[0]) / totals.length : 0;
        quarterly_projection = (predicted_next_month + trend) + (predicted_next_month + trend * 2) + (predicted_next_month + trend * 3);
        
        // Hiring Impact (assuming 5% headcount growth)
        const activeEmployees = await prisma.employee.count({ where: { company_id: companyId, employment_status: 'ACTIVE' } });
        const avgCostPerEmployee = mean / (activeEmployees || 1);
        const projectedNewHires = Math.ceil(activeEmployees * 0.05);
        hiring_impact = projectedNewHires * avgCostPerEmployee;
      }

      MetricsService.recordHistogram('forecast_duration_ms', Date.now() - start);

      return {
        predicted_next_month,
        confidence_interval,
        quarterly_projection,
        hiring_impact,
        trend_multiplier: predicted_next_month > 0 && totals.length > 0 ? predicted_next_month / totals[totals.length - 1] : 1.0
      };
    } catch (error) {
      console.error('Forecast Error:', error);
      return {
        predicted_next_month: 0,
        confidence_interval: { lower: 0, upper: 0 },
        quarterly_projection: 0,
        hiring_impact: 0,
        trend_multiplier: 1.0
      };
    }
  }
}
