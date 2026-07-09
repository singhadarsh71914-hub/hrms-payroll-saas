// @ts-nocheck
import prisma from '../lib/prisma.ts';
import { addReportJob } from './queue.service.ts';

export class ReportService {
  static async queueExecutiveReport(companyId: string, format: string, recipients: string[] = []) {
    const job = await addReportJob(`executive_${companyId}_${Date.now()}`, {
      company_id: companyId,
      report_type: 'EXECUTIVE',
      format,
      recipients
    });
    return { status: 'queued', jobId: job.id };
  }

  static async queuePayrollReport(companyId: string, format: string = 'csv', recipients: string[] = []) {
    const job = await addReportJob(`payroll_${companyId}_${Date.now()}`, {
      company_id: companyId,
      report_type: 'PAYROLL',
      format,
      recipients
    });
    return { status: 'queued', jobId: job.id };
  }

  static async queueDepartmentReport(companyId: string, format: string = 'csv', recipients: string[] = []) {
    const job = await addReportJob(`department_${companyId}_${Date.now()}`, {
      company_id: companyId,
      report_type: 'DEPARTMENT',
      format,
      recipients
    });
    return { status: 'queued', jobId: job.id };
  }

  static async scheduleReport(companyId: string, data: any) {
    return await prisma.scheduledReport.create({
      data: {
        company_id: companyId,
        report_type: data.report_type,
        frequency: data.frequency,
        recipients: data.recipients,
      }
    });
  }

  static async getScheduledReports(companyId: string) {
    return await prisma.scheduledReport.findMany({
      where: { company_id: companyId }
    });
  }
}
