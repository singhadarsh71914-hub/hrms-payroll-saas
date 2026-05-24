import prisma from './src/lib/prisma.ts';
import { Prisma } from '@prisma/client';

const companyId = '24674570-3c3c-4e24-8f8e-ebf6f088a838';

async function seed() {
  console.log('Starting seeding...');

  // 1. Create Salary Components if they don't exist
  const components = [
    { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', category: 'FIXED' },
    { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING', category: 'FIXED' },
    { code: 'DA', name: 'Dearness Allowance', type: 'EARNING', category: 'FIXED' },
    { code: 'SPECIAL', name: 'Special Allowance', type: 'EARNING', category: 'FIXED' },
  ];

  const componentMap: Record<string, string> = {};

  for (const comp of components) {
    const created = await prisma.salaryComponent.upsert({
      where: { company_id_code: { company_id: companyId, code: comp.code } },
      update: {},
      create: {
        ...comp,
        company_id: companyId,
        type: comp.type as any,
        category: comp.category as any,
      },
    });
    componentMap[comp.code] = created.id;
  }

  // 2. Create a Standard Salary Structure
  const structure = await prisma.salaryStructure.create({
    data: {
      company_id: companyId,
      name: 'Standard Structure',
      components: {
        create: [
          { salary_component_id: componentMap['BASIC'], calculation_type: 'PERCENTAGE_OF_CTC', value: new Prisma.Decimal(50), sequence: 1 },
          { salary_component_id: componentMap['HRA'], calculation_type: 'PERCENTAGE_OF_BASIC', value: new Prisma.Decimal(40), sequence: 2 },
          { salary_component_id: componentMap['DA'], calculation_type: 'PERCENTAGE_OF_BASIC', value: new Prisma.Decimal(10), sequence: 3 },
          { salary_component_id: componentMap['SPECIAL'], calculation_type: 'FLAT_AMOUNT', value: new Prisma.Decimal(5000), sequence: 4 },
        ],
      },
    },
  });

  // 3. Create 3 Employees with different CTCs
  const testEmployees = [
    {
      code: 'EMP001',
      first: 'Aarav',
      last: 'Sharma',
      email: 'aarav@example.com',
      ctcAnnual: 600000, // 50k monthly -> No TDS
    },
    {
      code: 'EMP002',
      first: 'Ishani',
      last: 'Verma',
      email: 'ishani@example.com',
      ctcAnnual: 1500000, // 1.25L monthly -> Significant TDS
    },
    {
      code: 'EMP003',
      first: 'Kabir',
      last: 'Singh',
      email: 'kabir@example.com',
      ctcAnnual: 3000000, // 2.5L monthly -> Higher Slab TDS
    },
  ];

  for (const emp of testEmployees) {
    const employee = await prisma.employee.upsert({
      where: { company_id_employee_code: { company_id: companyId, employee_code: emp.code } },
      update: {},
      create: {
        company_id: companyId,
        employee_code: emp.code,
        first_name: emp.first,
        last_name: emp.last,
        work_email: emp.email,
        date_of_joining: new Date('2024-01-01'),
        employment_status: 'ACTIVE',
      },
    });

    await prisma.employeeSalary.create({
      data: {
        employee_id: employee.id,
        salary_structure_id: structure.id,
        ctc_annual: new Prisma.Decimal(emp.ctcAnnual),
        ctc_monthly: new Prisma.Decimal(emp.ctcAnnual / 12),
        effective_from: new Date('2024-01-01'),
      },
    });
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
