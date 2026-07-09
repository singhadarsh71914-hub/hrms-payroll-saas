import { Worker, Job } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import prisma from '../lib/prisma.ts';
import fs from 'fs';
import path from 'path';
import { format as formatCsv } from 'fast-csv';
import PDFDocument from 'pdfkit';
import nodemailer from 'nodemailer';
import { StorageService } from '../services/storage.service.ts';
import { AuditService } from '../services/audit.service.ts';

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

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  }
});

const generateStreamingCSV = async (job: Job, companyId: string, reportType: string, filename: string): Promise<string> => {
  const filepath = path.join('/tmp', filename);
  const writeStream = fs.createWriteStream(filepath);
  const csvStream = formatCsv({ headers: true });
  
  csvStream.pipe(writeStream);

  // Cursor Pagination for Memory Safety (OOM protection)
  let lastId = '';
  const take = 1000;
  let hasMore = true;

  while (hasMore) {
    let batch: any[] = [];
    if (reportType === 'PAYROLL') {
      batch = await prisma.$queryRaw`SELECT p.id as row_id, p.employee_id, e.employee_code, e.first_name, e.last_name, p.gross_salary, p.net_salary FROM "PayrollPayslip" p JOIN "Employee" e ON p.employee_id = e.id JOIN "PayrollRun" r ON p.payroll_run_id = r.id WHERE r.company_id = ${companyId} AND p.id > ${lastId} ORDER BY p.id ASC LIMIT ${take}`;
    } else if (reportType === 'DEPARTMENT') {
      batch = await prisma.$queryRaw`SELECT d.id as row_id, d.name as department, count(e.id) as headcount FROM "Department" d JOIN "Employee" e ON e.department_id = d.id WHERE d.company_id = ${companyId} AND d.id > ${lastId} GROUP BY d.id, d.name ORDER BY d.id ASC LIMIT ${take}`;
    } else {
      batch = [{ info: 'No data', row_id: 'zzzz' }];
      hasMore = false;
    }

    for (const row of batch) {
      lastId = row.row_id;
      const safeRow: any = {};
      for (const [key, val] of Object.entries(row)) {
         if (key === 'row_id') continue;
         safeRow[key] = typeof val === 'bigint' ? Number(val) : val;
      }
      csvStream.write(safeRow);
    }

    if (batch.length < take) {
      hasMore = false;
    }
  }

  csvStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filepath));
    writeStream.on('error', reject);
  });
};

const generatePDF = async (companyId: string, reportType: string, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filepath = path.join('/tmp', filename);
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filepath);
    
    doc.pipe(writeStream);
    
    // Header
    doc.fontSize(20).text(`Enterprise HRMS Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Report Type: ${reportType}`);
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Company ID: ${companyId}`);
    doc.moveDown(2);

    // Sample KPI Table stub
    doc.fontSize(12).text('Summary Metrics:', { underline: true });
    doc.moveDown();
    doc.text(`Active Headcount: 245`);
    doc.text(`Total Payroll Liability: 45,000,000 INR`);
    
    doc.moveDown(4);
    
    // Footer / Pagination
    let pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `Page ${i + 1} of ${pages.count} - strictly confidential`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }
    
    doc.end();

    writeStream.on('finish', () => resolve(filepath));
    writeStream.on('error', reject);
  });
};

export const reportWorker = isRedisEnabled ? new Worker('report-generation', async (job: Job) => {
  const { company_id, report_type, format, recipients } = job.data;
  let filepath = '';
  const filename = `${report_type}_${company_id}_${Date.now()}.${format}`;
  
  if (format === 'csv') {
    filepath = await generateStreamingCSV(job, company_id, report_type, filename);
  } else if (format === 'pdf') {
    filepath = await generatePDF(company_id, report_type, filename);
  } else {
    throw new Error('Unsupported format');
  }

  const finalDestination = await StorageService.upload(filepath, `reports/${filename}`);

  if (recipients && recipients.length > 0) {
    try {
      await transporter.sendMail({
        from: '"HRMS System" <no-reply@hrms.com>',
        to: recipients.join(', '),
        subject: `Your ${report_type} Report is Ready`,
        text: `Please find the attached ${report_type} report.`,
        attachments: [
          { filename, path: filepath }
        ]
      });
      await AuditService.log({ companyId: company_id, action: 'REPORT_EMAILED', entityType: 'REPORT', metadata: { report_type, recipients } });
    } catch (e: any) {
      console.error(`Failed to email report: ${e.message}`);
      await AuditService.log({ companyId: company_id, action: 'REPORT_EMAIL_FAILED', entityType: 'REPORT', metadata: { report_type, recipients, error: e.message } });
      throw e;
    }
  }

  fs.unlinkSync(filepath);

  return { success: true, url: finalDestination };
}, { connection: connection as any, concurrency: 1 }) : { on: () => {} } as unknown as Worker;

reportWorker.on('error', (err: any) => {
  if ((err as any).code !== 'ECONNREFUSED') console.error('reportWorker error:', err.message);
});
