import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PayrollService } from './src/services/payroll.service.ts';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const COMPANY_ID = '11d75673-7edf-4fb7-9fd6-aea255984813';

  // Test 1: Run Payroll (Oct 2026) ---
  console.log('--- TEST 1: Run Payroll (Oct 2026) ---');
  try {
    const run = await PayrollService.processPayroll(COMPANY_ID, 10, 2026);
    console.log('✅ Payroll Processed successfully:', run.id);
    console.log('   Status:', run.status);
    console.log('   Total Processed:', run.total_employees);
    console.log('   Skipped:', run.skipped_employees);
    console.log('   Gross:', run.total_gross.toString());
    console.log('   Net:', run.total_net.toString());
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }

  // Test 2: Verify Employees are processed accurately
  console.log('\n--- TEST 2: Inspect an Employee Payslip ---');
  const runData = await prisma.payrollRun.findFirst({
    where: { company_id: COMPANY_ID, month: 10, year: 2026 }
  });

  if (runData) {
    const payslips = await prisma.payslip.findMany({
      where: { payroll_run_id: runData.id },
      include: {
        employee: { select: { first_name: true, last_name: true, salaries: true } },
        line_items: true
      }
    });

    if (payslips.length > 0) {
      const p = payslips[0];
      console.log(`✅ Loaded payslip for: ${p.employee.first_name} ${p.employee.last_name}`);
      console.log(`   Monthly CTC (DB): ₹${Number(p.employee.salaries[0].ctc_monthly).toLocaleString('en-IN')}`);
      console.log(`   Annual CTC (DB): ₹${Number(p.employee.salaries[0].ctc_annual).toLocaleString('en-IN')}`);
      console.log('   --- Line Items ---');
      for (const item of p.line_items) {
        console.log(`   ${item.component_name}: ₹${Number(item.amount).toLocaleString('en-IN')}`);
      }
      console.log(`   --- Deductions ---`);
      console.log(`   PF: ₹${Number(p.pf_employee).toLocaleString('en-IN')}`);
      console.log(`   PT: ₹${Number(p.professional_tax).toLocaleString('en-IN')}`); // We put it in line items or direct?
      // Wait, PT might be 0 directly on the payslip model but listed in line_items?
      console.log(`   Total Deductions: ₹${Number(p.total_deductions).toLocaleString('en-IN')}`);
      console.log(`   Final Net: ₹${Number(p.net_salary).toLocaleString('en-IN')}`);
    }
  }

  // Test 3: Run Payroll Again (Should Fail Gracefully)
  console.log('\n--- TEST 3: Duplicate Payroll Rejection ---');
  try {
    await PayrollService.processPayroll(COMPANY_ID, 10, 2026);
    console.error('❌ Failed: Should have rejected duplicate run!');
  } catch (err) {
    console.log('✅ Gracefully blocked:', err.message);
  }
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });
