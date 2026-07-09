import prisma from '../../lib/prisma.ts';
import { MetricsService } from '../metrics.service.ts';

export class FeatureStoreService {
  /**
   * Save a snapshot for a company
   */
  static async saveCompanySnapshot(data: any) {
    const { company_id, snapshot_date, attrition_risk, burnout_risk, attendance_score, productivity_score, overtime_risk, forecast_payload, anomalies, recommendations } = data;
    const start = Date.now();

    const result = await prisma.companyIntelligenceSnapshot.create({
      data: {
        company_id,
        snapshot_date,
        attrition_risk,
        burnout_risk,
        attendance_score,
        productivity_score,
        overtime_risk,
        forecast_payload,
        anomalies,
        recommendations
      }
    });

    MetricsService.increment('intelligence_snapshots_total', { type: 'company', company_id });
    MetricsService.recordHistogram('feature_store_write_ms', Date.now() - start);

    if (anomalies && anomalies.length > 0) {
      anomalies.forEach((a: any) => {
        MetricsService.increment('anomalies_detected_total', { type: a.type || 'UNKNOWN', severity: a.severity || 'LOW' });
      });
    }

    return result;
  }

  /**
   * Save a snapshot for a department
   */
  static async saveDepartmentSnapshot(data: any) {
    const { company_id, department_id, snapshot_date, attrition_risk, burnout_risk, attendance_score, productivity_score, overtime_risk, forecast_payload, anomalies, recommendations } = data;

    const result = await prisma.departmentIntelligenceSnapshot.create({
      data: {
        company_id,
        department_id,
        snapshot_date,
        attrition_risk,
        burnout_risk,
        attendance_score,
        productivity_score,
        overtime_risk,
        forecast_payload,
        anomalies,
        recommendations
      }
    });

    MetricsService.increment('intelligence_snapshots_total', { type: 'department', company_id });
    return result;
  }

  /**
   * Save a snapshot for an employee
   */
  static async saveEmployeeSnapshot(data: any) {
    const { company_id, employee_id, snapshot_date, attrition_risk, burnout_risk, attendance_score, productivity_score, overtime_risk, anomalies, recommendations } = data;

    const result = await prisma.employeeIntelligenceSnapshot.create({
      data: {
        company_id,
        employee_id,
        snapshot_date,
        attrition_risk,
        burnout_risk,
        attendance_score,
        productivity_score,
        overtime_risk,
        anomalies,
        recommendations
      }
    });

    MetricsService.increment('intelligence_snapshots_total', { type: 'employee', company_id });
    return result;
  }

  /**
   * Retrieve trailing history for a company
   */
  static async getCompanyHistory(company_id: string, days = 30) {
    MetricsService.increment('feature_store_reads_total', { type: 'company', company_id });
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return prisma.companyIntelligenceSnapshot.findMany({
      where: {
        company_id,
        snapshot_date: {
          gte: fromDate
        }
      },
      orderBy: { snapshot_date: 'asc' }
    });
  }

  /**
   * Retrieve latest snapshot for a company
   */
  static async getLatestCompanySnapshot(company_id: string) {
    MetricsService.increment('feature_store_reads_total', { type: 'company_latest', company_id });
    return prisma.companyIntelligenceSnapshot.findFirst({
      where: { company_id },
      orderBy: { snapshot_date: 'desc' }
    });
  }
  
  /**
   * Retrieve latest snapshot for all departments
   */
  static async getLatestDepartmentSnapshots(company_id: string) {
    MetricsService.increment('feature_store_reads_total', { type: 'department_latest', company_id });
    
    // We get the most recent distinct department snapshots
    // Prisma does not have distinct on MySQL/SQLite in the way we want often, so we will fetch last N days and deduplicate in memory, or just fetch all and group.
    // For simplicity, fetch last 7 days and group by department
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    
    const snapshots = await prisma.departmentIntelligenceSnapshot.findMany({
      where: { company_id, snapshot_date: { gte: fromDate } },
      orderBy: { snapshot_date: 'desc' },
      include: { department: true }
    });
    
    const latest = new Map();
    for (const snap of snapshots) {
        if (!latest.has(snap.department_id)) {
            latest.set(snap.department_id, snap);
        }
    }
    
    return Array.from(latest.values());
  }

  /**
   * Retrieve latest snapshot for all employees (top risks)
   */
  static async getLatestEmployeeSnapshots(company_id: string) {
    MetricsService.increment('feature_store_reads_total', { type: 'employee_latest', company_id });
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    
    const snapshots = await prisma.employeeIntelligenceSnapshot.findMany({
      where: { company_id, snapshot_date: { gte: fromDate } },
      orderBy: { snapshot_date: 'desc' },
      include: { employee: true }
    });
    
    const latest = new Map();
    for (const snap of snapshots) {
        if (!latest.has(snap.employee_id)) {
            latest.set(snap.employee_id, snap);
        }
    }
    
    return Array.from(latest.values());
  }
}
