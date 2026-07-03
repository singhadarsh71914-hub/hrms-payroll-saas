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
  const run = await prisma.payrollRun.findFirst({
    where: { company_id: COMPANY_ID, month: 10, year: 2026 }
  });

  const payslip = await prisma.payslip.findFirst({
    where: { payroll_run_id: run.id },
    include: {
      employee: { include: { designation: true } },
      payroll_run: { include: { company: true } },
      line_items: true
    }
  });

  console.log("PAYSLIP DATA:");
  console.log({
    basic: payslip.line_items.find(i => i.component_name === 'Basic Pay')?.amount,
    pf: payslip.pf_employee,
    tds: payslip.tds,
    gross: payslip.gross_salary,
    deductions: payslip.total_deductions,
    net: payslip.net_salary,
  });

  const doc = await PayrollService.generatePayslipPDF(run.id, payslip.employee_id);
  const out = fs.createWriteStream('test-payslip.pdf');
  doc.pipe(out);
  
  console.log("PDF generation piped.");
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });
