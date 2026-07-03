import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PayrollService } from './src/services/payroll.service.ts';
import fs from 'fs';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const COMPANY_ID = '11d75673-7edf-4fb7-9fd6-aea255984813';

  // Run payroll for Feb 2027
  console.log("--- RUNNING PAYROLL BATCH (FEB 2027) ---");
  let run;
  try {
    run = await PayrollService.processPayroll(COMPANY_ID, 2, 2027);
    console.log("Payroll run created:", run.id);
  } catch (err) {
    if (err.message.includes('already been processed')) {
      run = await prisma.payrollRun.findFirst({ where: { company_id: COMPANY_ID, month: 2, year: 2027 } });
      console.log("Using existing run:", run.id);
    } else {
      throw err;
    }
  }

  const payslip = await prisma.payslip.findFirst({
    where: { payroll_run_id: run.id }
  });

  console.log("--- GENERATING PDF ---");
  const doc = await PayrollService.generatePayslipPDF(run.id, payslip.employee_id);
  const out = fs.createWriteStream('test-payslip-nov.pdf');
  doc.pipe(out);

  console.log("PDF generation piped.");
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });
