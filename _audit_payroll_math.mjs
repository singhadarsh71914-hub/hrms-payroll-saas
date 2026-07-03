import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PayrollService } from './src/services/payroll.service.ts';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyRun(month, expectTDS) {
  console.log(`\n===========================================`);
  console.log(`VERIFYING RUN: Month ${month}, Expect TDS: ${expectTDS}`);
  console.log(`===========================================`);
  
  const COMPANY_ID = '11d75673-7edf-4fb7-9fd6-aea255984813';
  let run;
  try {
    run = await PayrollService.processPayroll(COMPANY_ID, month, 2026);
  } catch (err) {
    if (err.message.includes('already been processed')) {
      run = await prisma.payrollRun.findFirst({
        where: { company_id: COMPANY_ID, month, year: 2026 }
      });
    } else {
      throw err;
    }
  }

  const payslips = await prisma.payslip.findMany({
    where: { payroll_run_id: run.id },
    include: { employee: true }
  });

  let allPass = true;

  for (const p of payslips) {
    const gross = Number(p.gross_salary);
    const pf = Number(p.pf_employee);
    const pt = Number(p.professional_tax);
    const tds = Number(p.tds);
    const esi = Number(p.esi_employee);
    const totalDeductions = Number(p.total_deductions);
    const net = Number(p.net_salary);

    const name = `${p.employee.first_name} ${p.employee.last_name}`;
    console.log(`\nEmployee: ${name}`);
    console.log(`  Gross: ₹${gross.toLocaleString('en-IN')}`);
    console.log(`  PF:    ₹${pf.toLocaleString('en-IN')}`);
    console.log(`  PT:    ₹${pt.toLocaleString('en-IN')}`);
    console.log(`  TDS:   ₹${tds.toLocaleString('en-IN')}`);
    console.log(`  Other: ₹${esi.toLocaleString('en-IN')} (ESI)`);
    console.log(`  Net:   ₹${net.toLocaleString('en-IN')}`);

    const sumDeductions = pf + pt + tds + esi;
    const computedNet = gross - sumDeductions;
    
    // Checks
    const diff = Math.abs(net - computedNet);
    if (diff > 0.01) {
      console.log(`  ❌ FAIL: Gross - Deductions != Net (Diff: ${diff})`);
      allPass = false;
    } else {
      console.log(`  ✅ Math perfectly balances.`);
    }

    if (gross < 0 || pf < 0 || pt < 0 || tds < 0 || net < 0) {
      console.log(`  ❌ FAIL: Negative value found!`);
      allPass = false;
    }
    
    if (net > gross) {
      console.log(`  ❌ FAIL: Net > Gross!`);
      allPass = false;
    }

    if (!expectTDS && tds > 0) {
      console.log(`  ❌ FAIL: TDS is ${tds} but ENABLE_TDS_ENGINE=false!`);
      allPass = false;
    }
  }

  return allPass;
}

async function main() {
  // Check Oct run (already generated with TDS ON)
  const passOct = await verifyRun(10, true);

  // Generate Nov run with TDS OFF
  process.env.ENABLE_TDS_ENGINE = 'false';
  const passNov = await verifyRun(11, false);

  console.log(`\nFINAL RESULT: ${passOct && passNov ? 'PASS' : 'FAIL'}`);
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });
