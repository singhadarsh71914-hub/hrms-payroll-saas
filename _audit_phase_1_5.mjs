import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function testCase(name, setupStructureFn) {
  console.log(`\n--- Running Case: ${name} ---`);
  const company = await prisma.company.create({ data: { name: 'Test Corp ' + Date.now() } });
  const structure = await prisma.salaryStructure.create({
    data: { company_id: company.id, name: 'Structure ' + name, is_active: true }
  });
  
  await setupStructureFn(company.id, structure.id);

  const employee = await prisma.employee.create({
    data: {
      company_id: company.id,
      first_name: 'Test',
      last_name: 'Employee',
      work_email: 'test' + Date.now() + '@test.com',
      employee_code: 'TEST-' + Date.now(),
      employment_status: 'ACTIVE',
      date_of_joining: new Date('2026-01-01')
    }
  });

  await prisma.employeeSalary.create({
    data: {
      employee_id: employee.id,
      salary_structure_id: structure.id,
      ctc_annual: 1200000,
      ctc_monthly: 100000,
      effective_from: new Date('2026-01-01')
    }
  });

  try {
    const run = await PayrollService.processPayroll(company.id, 5, 2027);
    console.log(`[PASS] Case ${name} Processed: Run ID ${run.id}`);
  } catch (err) {
    console.log(`[FAIL THROWN] Case ${name}: ${err.message}`);
  }
}

async function runTests() {
  await testCase('Case A (40/20/40)', async (cId, sId) => {
    const c1 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'C1', name: 'Basic', type: 'EARNING', category: 'FIXED' } });
    const c2 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'C2', name: 'HRA', type: 'EARNING', category: 'FIXED' } });
    const c3 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'C3', name: 'Special', type: 'EARNING', category: 'FIXED' } });

    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c1.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 40, sequence: 1 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c2.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 20, sequence: 2 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c3.id, calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 3 } });
  });

  await testCase('Case B (50/30/10/10)', async (cId, sId) => {
    const c1 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'B1', name: 'Basic', type: 'EARNING', category: 'FIXED' } });
    const c2 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'B2', name: 'HRA', type: 'EARNING', category: 'FIXED' } });
    const c3 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'B3', name: 'Internet', type: 'EARNING', category: 'FIXED' } });
    const c4 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'B4', name: 'Special', type: 'EARNING', category: 'FIXED' } });

    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c1.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 50, sequence: 1 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c2.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 30, sequence: 2 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c3.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 10, sequence: 3 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c4.id, calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 4 } });
  });

  await testCase('Case C (60/30/20)', async (cId, sId) => {
    const c1 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'F1', name: 'Basic', type: 'EARNING', category: 'FIXED' } });
    const c2 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'F2', name: 'HRA', type: 'EARNING', category: 'FIXED' } });
    const c3 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'F3', name: 'Internet', type: 'EARNING', category: 'FIXED' } });

    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c1.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 60, sequence: 1 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c2.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 30, sequence: 2 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c3.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 20, sequence: 3 } });
  });

  await testCase('Case D (Double Remainder)', async (cId, sId) => {
    const c1 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'D1', name: 'Basic', type: 'EARNING', category: 'FIXED' } });
    const c2 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'D2', name: 'R1', type: 'EARNING', category: 'FIXED' } });
    const c3 = await prisma.salaryComponent.create({ data: { company_id: cId, code: 'D3', name: 'R2', type: 'EARNING', category: 'FIXED' } });

    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c1.id, calculation_type: 'PERCENTAGE_OF_CTC', value: 40, sequence: 1 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c2.id, calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 2 } });
    await prisma.salaryStructureComponent.create({ data: { salary_structure_id: sId, salary_component_id: c3.id, calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 3 } });
  });

}

runTests().catch(console.error).finally(() => process.exit(0));
