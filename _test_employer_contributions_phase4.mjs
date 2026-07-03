import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function runTests() {
  console.log('--- STARTING PHASE 4 TESTS ---');

  const dbTestCompany = await prisma.company.findFirst();
  if (!dbTestCompany) {
    console.error('[FAIL] No company found.');
    process.exit(1);
  }
  const companyId = dbTestCompany.id;

  // Cleanup past test data
  await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_USER' } } } });
  await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_USER' } } });
  await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_USER' } });
  
  await prisma.employeeSalary.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PHASE4' } } } });
  await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PHASE4' } } } });
  await prisma.salaryStructure.deleteMany({ where: { company_id: companyId, name: { startsWith: 'TEST_PHASE4' } } });
  await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'TEST_PH4_' } } });

  // Get a test employee
  const employee = await prisma.employee.findFirst({ where: { company_id: companyId, employment_status: 'ACTIVE' } });
  if (!employee) {
    console.error('[SKIP] No active employee found.');
    process.exit(0);
  }

  // Create Salary Components
  const basicComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Basic', code: 'TEST_PH4_BASIC', type: 'EARNING', category: 'FIXED', is_active: true }
  });
  const pfComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Employee PF', code: 'PF', type: 'DEDUCTION', category: 'FIXED', is_active: true }
  });
  const empPfComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Employer PF', code: 'TEST_PH4_EMP_PF', type: 'EMPLOYER_CONTRIBUTION', category: 'FIXED', is_active: true }
  });
  const insuranceComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Insurance', code: 'TEST_PH4_INS', type: 'EMPLOYER_CONTRIBUTION', category: 'FIXED', is_active: true }
  });
  const negativeEmpComp = await prisma.salaryComponent.create({
    data: { company_id: companyId, name: 'Negative', code: 'TEST_PH4_NEG', type: 'EMPLOYER_CONTRIBUTION', category: 'FIXED', is_active: true }
  });

  async function testStructure(name, componentsToCreate, checkFn) {
    console.log(`\nTesting: ${name}`);
    const struct = await prisma.salaryStructure.create({
      data: {
        company_id: companyId,
        name: name,
        components: { create: componentsToCreate }
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
      const run = await PayrollService.processPayroll(companyId, 5, 2026);
      await prisma.payrollRun.update({ where: { id: run.id }, data: { created_by: 'TEST_USER' } });
      const payslip = await prisma.payslip.findFirst({ where: { payroll_run_id: run.id }, include: { line_items: true } });
      await checkFn(run, payslip);
    } catch (err) {
      await checkFn(null, null, err);
    } finally {
      // Cleanup runs for next test
      await prisma.payslipLineItem.deleteMany({ where: { payslip: { payroll_run: { company_id: companyId, created_by: 'TEST_USER' } } } });
      await prisma.payslip.deleteMany({ where: { payroll_run: { company_id: companyId, created_by: 'TEST_USER' } } });
      await prisma.payrollRun.deleteMany({ where: { company_id: companyId, created_by: 'TEST_USER' } });
      
      await prisma.employeeSalary.delete({ where: { id: salary.id } });
    }
  }

  // Case A: Employer PF only
  await testStructure('TEST_PHASE4_A', [
    { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
    { salary_component_id: empPfComp.id, calculation_type: 'PERCENTAGE_OF_BASIC', value: 12, sequence: 2 }
  ], (run, payslip, err) => {
    if (err) return console.error('[FAIL] Case A:', err.message);
    const hasEmpPF = payslip.line_items.some(i => i.component_name === 'Employer PF');
    if (hasEmpPF && Number(payslip.total_employer_contributions) === 1200) {
      console.log('[PASS] Case A: Employer PF only');
    } else {
      console.error('[FAIL] Case A: Missing or incorrect employer PF');
    }
  });

  // Case B: Employer PF + Insurance
  await testStructure('TEST_PHASE4_B', [
    { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
    { salary_component_id: empPfComp.id, calculation_type: 'PERCENTAGE_OF_BASIC', value: 12, sequence: 2 },
    { salary_component_id: insuranceComp.id, calculation_type: 'FLAT_AMOUNT', value: 500, sequence: 3 }
  ], (run, payslip, err) => {
    if (err) return console.error('[FAIL] Case B:', err.message);
    if (Number(payslip.total_employer_contributions) === 1700) {
      console.log('[PASS] Case B: Employer PF + Insurance');
    } else {
      console.error('[FAIL] Case B: Incorrect total employer contributions');
    }
  });

  // Case C: Net salary unchanged & Case D: Company cost calculation
  await testStructure('TEST_PHASE4_CD', [
    { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
    { salary_component_id: empPfComp.id, calculation_type: 'FLAT_AMOUNT', value: 1000, sequence: 2 }
  ], (run, payslip, err) => {
    if (err) return console.error('[FAIL] Case C/D:', err.message);
    
    // Net should not be reduced by employer contribution (Base gross 10000, minus default pt/esi/pf. Wait, pf is 12% of basic = 1200, ESI = 75, PT = 200 => deductions = 1475. Net = 8525).
    // Gross = 10000.
    const gross = Number(payslip.gross_salary);
    const net = Number(payslip.net_salary);
    const ded = Number(payslip.total_deductions);
    const companyCost = Number(payslip.total_company_cost);
    
    if (net === gross - ded) {
      console.log('[PASS] Case C: Net salary unchanged');
    } else {
      console.error('[FAIL] Case C: Net salary is wrong');
    }

    if (companyCost === gross + 1000) {
      console.log('[PASS] Case D: Company cost calculation');
    } else {
      console.error('[FAIL] Case D: Company cost is wrong');
    }
  });

  // Case E: Negative employer contribution
  await testStructure('TEST_PHASE4_E', [
    { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
    { salary_component_id: negativeEmpComp.id, calculation_type: 'FLAT_AMOUNT', value: -500, sequence: 2 }
  ], (run, payslip, err) => {
    if (err && err.message.includes('Employer contribution cannot be negative')) {
      console.log('[PASS] Case E: Negative employer contribution fails correctly');
    } else {
      console.error('[FAIL] Case E: Did not fail correctly', err?.message);
    }
  });

  // Case F: Employer contribution included in deductions
  await testStructure('TEST_PHASE4_F', [
    { salary_component_id: basicComp.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
    { salary_component_id: empPfComp.id, calculation_type: 'FLAT_AMOUNT', value: 1000, sequence: 2 } // its code is TEST_PH4_EMP_PF, not PF, but its name is "Employer PF"
  ], (run, payslip, err) => {
    if (err) return console.error('[FAIL] Case F:', err.message);
    
    const isEmployerContribInDeductions = payslip.line_items.some(i => i.component_type === 'DEDUCTION' && i.component_name === 'Employer PF');
    
    if (!isEmployerContribInDeductions) {
      console.log('[PASS] Case F: Employer contribution NOT included in deductions');
    } else {
      console.error('[FAIL] Case F: Employer contribution included in deductions!');
    }
  });

  // Final Cleanup
  await prisma.employeeSalary.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PHASE4' } } } });
  await prisma.salaryStructureComponent.deleteMany({ where: { salary_structure: { name: { startsWith: 'TEST_PHASE4' } } } });
  await prisma.salaryStructure.deleteMany({ where: { company_id: companyId, name: { startsWith: 'TEST_PHASE4' } } });
  await prisma.salaryComponent.deleteMany({ where: { company_id: companyId, code: { startsWith: 'TEST_PH4_' } } });

  console.log('\n--- PHASE 4 TESTS COMPLETED ---');
}

runTests().catch(console.error).finally(() => process.exit(0));
