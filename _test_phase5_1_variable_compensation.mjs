import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function runTests() {
  console.log('--- STARTING PHASE 5.1 TESTS ---');

  const dbTestCompany = await prisma.company.findFirst();
  if (!dbTestCompany) {
    console.error('[FAIL] No company found.');
    process.exit(1);
  }
  const companyId = dbTestCompany.id;

  const employee = await prisma.employee.findFirst({ where: { company_id: companyId, employment_status: 'ACTIVE' } });
  if (!employee) {
    console.error('[SKIP] No active employee found.');
    process.exit(0);
  }

  // Cleanup past test runs
  await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_PH5_1' } } } });
  await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_PH5_1' } } });
  await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_PH5_1' } });
  await prisma.employeeBonus.deleteMany({ where: { employee_id: employee.id, name: { startsWith: 'TEST_' } } });
  
  await prisma.employeeSalary.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PH5_1' } } } });
  await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PH5_1' } } } });
  await prisma.salaryStructure.deleteMany({ where: { company_id: companyId, name: { startsWith: 'TEST_PH5_1' } } });
  await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'PH5_1_' } } });

  // Create structure
  const basicComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Core Salary', code: 'PH5_1_CORE', type: 'EARNING', category: 'FIXED', is_active: true, system_role: 'BASIC' }
  });
  
  const struct = await prisma.salaryStructure.create({
    data: {
      company_id: companyId,
      name: 'TEST_PH5_1_STRUCT',
      components: {
        create: [
          { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 }
        ]
      }
    }
  });

  const salary = await prisma.employeeSalary.create({
    data: {
      employee_id: employee.id,
      salary_structure_id: struct.id,
      effective_from: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      ctc_annual: 1200000,
      ctc_monthly: 100000
    }
  });

  const month = 8;
  const year = 2026;
  const effectiveMonthStr = `${year}-08`;

  // Case A: Joining bonus (Fixed)
  const joiningBonus = await prisma.employeeBonus.create({
    data: {
      employee_id: employee.id,
      company_id: companyId,
      type: 'JOINING',
      category: 'FIXED_BONUS',
      name: 'TEST_Joining',
      amount: 50000,
      recurring: false,
      effective_month: effectiveMonthStr,
      status: 'APPROVED',
      is_active: true
    }
  });

  // Case B: Monthly sales commission
  const commission = await prisma.employeeBonus.create({
    data: {
      employee_id: employee.id,
      company_id: companyId,
      type: 'SALES_COMMISSION',
      category: 'VARIABLE_COMPENSATION',
      name: 'TEST_Sales Comm',
      amount: 15000,
      recurring: false,
      effective_month: effectiveMonthStr,
      status: 'APPROVED',
      is_active: true
    }
  });

  // Case E: Unapproved variable payout
  const pendingOvertime = await prisma.employeeBonus.create({
    data: {
      employee_id: employee.id,
      company_id: companyId,
      type: 'OVERTIME',
      category: 'VARIABLE_COMPENSATION',
      name: 'TEST_OT Pending',
      amount: 5000,
      recurring: false,
      effective_month: effectiveMonthStr,
      status: 'PENDING', // SHOULD FAIL to be processed
      is_active: true
    }
  });

  try {
    const run = await PayrollService.processPayroll(companyId, month, year);
    await prisma.payrollRun.update({ where: { id: run.id }, data: { created_by: 'TEST_PH5_1' } });
    const payslips = await PayrollService.getPayslipsForRun(run.id);
    const payslip = payslips.find(p => p.employee_id === employee.id);

    if (!payslip) {
       console.error('[FAIL] Payslip not generated.');
    } else {
       // Check Joining
       const hasJoining = payslip.line_items.some(i => i.component_name.includes('TEST_Joining'));
       if (hasJoining) console.log('[PASS] Case A: Joining bonus');
       else console.error('[FAIL] Case A: Joining bonus missing');

       // Check Commission
       const hasCommission = payslip.line_items.some(i => i.component_name.includes('TEST_Sales Comm'));
       if (hasCommission) console.log('[PASS] Case B: Monthly sales commission changes');
       else console.error('[FAIL] Case B: Monthly sales commission missing');

       // Check Unapproved OT
       const hasPendingOT = payslip.line_items.some(i => i.component_name.includes('TEST_OT Pending'));
       if (!hasPendingOT) console.log('[PASS] Case E: Unapproved variable payout ignored');
       else console.error('[FAIL] Case E: Unapproved variable payout was applied!');
    }

    // Next Month Test (Case C)
    const runNext = await PayrollService.processPayroll(companyId, 9, 2026);
    await prisma.payrollRun.update({ where: { id: runNext.id }, data: { created_by: 'TEST_PH5_1' } });
    const payslipsNext = await PayrollService.getPayslipsForRun(runNext.id);
    const payslipNext = payslipsNext.find(p => p.employee_id === employee.id);
    
    if (payslipNext) {
       const hasCommNext = payslipNext.line_items.some(i => i.component_name.includes('TEST_Sales Comm'));
       if (!hasCommNext) console.log('[PASS] Case C: Overtime/Commission only applied once');
       else console.error('[FAIL] Case C: Variable Comp applied to next month!');
    }

    // Case D: Duplicate compensation FAIL
    await prisma.employeeBonus.create({
      data: {
        employee_id: employee.id,
        company_id: companyId,
        type: 'PERFORMANCE',
        category: 'VARIABLE_COMPENSATION',
        name: 'TEST_Perf 1',
        amount: 2000,
        recurring: false,
        effective_month: '2026-10',
        status: 'APPROVED',
        is_active: true
      }
    });

    await prisma.employeeBonus.create({
      data: {
        employee_id: employee.id,
        company_id: companyId,
        type: 'PERFORMANCE', // Duplicate type
        category: 'VARIABLE_COMPENSATION',
        name: 'TEST_Perf 2',
        amount: 3000,
        recurring: false,
        effective_month: '2026-10',
        status: 'APPROVED',
        is_active: true
      }
    });

    const runFail = await PayrollService.processPayroll(companyId, 10, 2026);
    await prisma.payrollRun.update({ where: { id: runFail.id }, data: { created_by: 'TEST_PH5_1' } });
    const payslipsFail = await PayrollService.getPayslipsForRun(runFail.id);
    const payslipFail = payslipsFail.find(p => p.employee_id === employee.id);

    // If duplicate was caught, employee will be added to `employeesMissingSalary` and no payslip generated
    if (!payslipFail) {
       console.log('[PASS] Case D: Duplicate compensation throws error/skips payroll');
    } else {
       console.error('[FAIL] Case D: Duplicate compensation was processed successfully!');
    }

  } catch (err) {
    console.error('Payroll processing error:', err);
  } finally {
    // Cleanup
    await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_PH5_1' } } } });
    await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_PH5_1' } } });
    await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_PH5_1' } });
    await prisma.employeeBonus.deleteMany({ where: { employee_id: employee.id, name: { startsWith: 'TEST_' } } });
    
    await prisma.employeeSalary.delete({ where: { id: salary.id } });
    await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure_id: struct.id } });
    await prisma.salaryStructure.delete({ where: { id: struct.id } });
    await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'PH5_1_' } } });
  }

  console.log('\n--- PHASE 5.1 TESTS COMPLETED ---');
}

runTests().catch(console.error).finally(() => process.exit(0));
