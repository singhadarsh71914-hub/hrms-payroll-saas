import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';
import { SalarySeedService } from './src/services/salary-seed.service.ts';

async function verify() {
  const company = await prisma.company.create({
    data: { name: 'Test Corp ' + Date.now() }
  });

  console.log("Created company:", company.id);

  const structure = await prisma.salaryStructure.create({
    data: { company_id: company.id, name: 'Standard Indian Corporate', is_active: true }
  });

  console.log("Created structure:", structure.id);

  await SalarySeedService.seedDefaultComponents(company.id, structure.id);
  console.log("Seeded components");

  const employee = await prisma.employee.create({
    data: {
      company_id: company.id,
      first_name: 'John',
      last_name: 'Doe',
      work_email: 'johndoe' + Date.now() + '@test.com',
      employee_code: 'JD-' + Date.now(),
      employment_status: 'ACTIVE',
      date_of_joining: new Date('2026-01-01')
    }
  });

  console.log("Created employee:", employee.id);

  await prisma.employeeSalary.create({
    data: {
      employee_id: employee.id,
      salary_structure_id: structure.id,
      ctc_annual: 1200000,
      ctc_monthly: 100000,
      effective_from: new Date('2026-01-01')
    }
  });

  console.log("Assigned salary 12LPA");

  const reFetchedStructure = await prisma.salaryStructure.findUnique({
    where: { id: structure.id },
    include: { components: { include: { salary_component: true } } }
  });

  for (const c of reFetchedStructure.components) {
    console.log(`- ${c.salary_component.code}: ${c.calculation_type} -> ${c.value} (Max Limit: ${c.max_limit || 'none'})`);
  }

  console.log("\n--- Processing Test Payroll ---");
  const run = await PayrollService.processPayroll(company.id, 4, 2027);
  console.log("Run completed:", run.id);
}

verify().catch(console.error).finally(() => process.exit(0));
