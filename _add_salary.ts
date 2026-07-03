import 'dotenv/config';
import prisma from './src/lib/prisma.ts';

async function fix() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, include: { employee: true }});
  if (!admin || !admin.employee) return;
  
  const structure = await prisma.salaryStructure.create({
    data: {
      company_id: admin.company_id,
      name: 'Default Structure',
      description: 'Default',
      base_percentage: 50,
      hra_percentage: 20,
      da_percentage: 10,
      allowances: {},
      deductions: {}
    }
  });

  await prisma.employeeSalary.create({
    data: {
      employee_id: admin.employee.id,
      salary_structure_id: structure.id,
      effective_from: new Date(),
      ctc_annual: 1200000,
      ctc_monthly: 100000
    }
  });
  console.log("Salary added to admin");
}
fix().finally(() => prisma.$disconnect());
