import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function runTests() {
  console.log('--- STARTING PHASE 4.5 TESTS ---');

  const dbTestCompany = await prisma.company.findFirst();
  if (!dbTestCompany) {
    console.error('[FAIL] No company found.');
    process.exit(1);
  }
  const companyId = dbTestCompany.id;

  // Cleanup
  await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_PH45' } } } });
  await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_PH45' } } });
  await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_PH45' } });
  
  await prisma.employeeSalary.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PH45' } } } });
  await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PH45' } } } });
  await prisma.salaryStructure.deleteMany({ where: { company_id: companyId, name: { startsWith: 'TEST_PH45' } } });
  await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'PH45_' } } });

  const employee = await prisma.employee.findFirst({ where: { company_id: companyId, employment_status: 'ACTIVE' } });
  if (!employee) {
    console.error('[SKIP] No active employee found.');
    process.exit(0);
  }

  // Create components with altered names/codes but proper system_roles
  const basicComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Core Salary', code: 'PH45_CORE', type: 'EARNING', category: 'FIXED', is_active: true, system_role: 'BASIC' }
  });
  const pfComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'EPF', code: 'PH45_EPF', type: 'DEDUCTION', category: 'STATUTORY', is_active: true, system_role: 'PF_EMPLOYEE' }
  });
  const empPfComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Company PF', code: 'PH45_COMP_PF', type: 'EMPLOYER_CONTRIBUTION', category: 'STATUTORY', is_active: true, system_role: 'PF_EMPLOYER' }
  });
  const insuranceComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Health Cover', code: 'PH45_INS', type: 'EMPLOYER_CONTRIBUTION', category: 'FIXED', is_active: true }
  });

  const struct = await prisma.salaryStructure.create({
    data: {
      company_id: companyId,
      name: 'TEST_PH45_STRUCT',
      components: {
        create: [
          { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 50, sequence: 1 },
          { salary_component_id: pfComp.id, calculation_type: 'PERCENTAGE_OF_BASIC', value: 12, sequence: 2 },
          { salary_component_id: empPfComp.id, calculation_type: 'PERCENTAGE_OF_BASIC', value: 12, sequence: 3 },
          { salary_component_id: insuranceComp.id, calculation_type: 'FLAT_AMOUNT', value: 500, sequence: 4 }
        ]
      }
    }
  });

  const salary = await prisma.employeeSalary.create({
    data: {
      employee_id: employee.id,
      salary_structure_id: struct.id,
      effective_from: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      ctc_annual: 120000,
      ctc_monthly: 10000
    }
  });

  try {
    const run = await PayrollService.processPayroll(companyId, 6, 2026);
    await prisma.payrollRun.update({ where: { id: run.id }, data: { created_by: 'TEST_PH45' } });
    
    const payslip = await prisma.payslip.findFirst({ where: { payroll_run_id: run.id }, include: { line_items: true } });

    // Case A: Rename "Employee PF" to "EPF" (PF calculations still work)
    // Basic = 50% of 10000 = 5000. PF Employee = 12% of 5000 = 600.
    console.log('Case A: Rename "Employee PF" to "EPF"');
    console.log('Case B: Rename "Basic Pay" to "Core Salary"');
    console.log('Case C: PF calculations still work');
    if (Number(payslip.pf_employee) === 600) {
      console.log('[PASS] Case A, B, C: PF calculation extracted from system_role = PF_EMPLOYEE successfully.');
    } else {
      console.error(`[FAIL] Expected Employee PF to be 600, got ${payslip.pf_employee}`);
    }

    // Case D: Employer PF still excluded from deductions
    console.log('Case D: Employer PF still excluded from deductions');
    // Employer PF = 12% of 5000 = 600.
    // Total Employer Contributions = 600 + 500 = 1100.
    if (Number(payslip.total_employer_contributions) === 1100) {
      console.log('[PASS] Case D: Total employer contributions match 1100.');
    } else {
      console.error(`[FAIL] Expected Employer Contributions 1100, got ${payslip.total_employer_contributions}`);
    }

    // Is it in deductions?
    const hasEmployerPFInDeductions = payslip.line_items.some(i => i.component_type === 'DEDUCTION' && i.component_name === 'Company PF');
    if (!hasEmployerPFInDeductions) {
      console.log('[PASS] Case D: Employer PF not included in deductions');
    } else {
      console.error('[FAIL] Case D: Employer PF incorrectly grouped under deductions');
    }

  } catch (err) {
    console.error('[FAIL] Process payroll errored:', err.message);
  } finally {
    // Cleanup
    await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_PH45' } } } });
    await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_PH45' } } });
    await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_PH45' } });
    
    await prisma.employeeSalary.delete({ where: { id: salary.id } });
    await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure_id: struct.id } });
    await prisma.salaryStructure.delete({ where: { id: struct.id } });
    await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'PH45_' } } });
  }

  console.log('\n--- PHASE 4.5 TESTS COMPLETED ---');
}

runTests().catch(console.error).finally(() => process.exit(0));
