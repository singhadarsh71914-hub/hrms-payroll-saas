const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Fetching companies...');
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log('No company found.');
    return;
  }
  
  console.log(`Company ID: ${company.id}`);
  
  const currentCount = await prisma.employee.count({ where: { company_id: company.id } });
  console.log(`Current employees: ${currentCount}`);
  
  if (currentCount >= 1000) {
    console.log('Already have 1000+ employees.');
    return;
  }

  const toCreate = 1000 - currentCount;
  console.log(`Creating ${toCreate} employees...`);
  
  const batchSize = 100;
  for (let i = 0; i < toCreate; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && (i + j) < toCreate; j++) {
      const idx = currentCount + i + j;
      batch.push({
        company_id: company.id,
        user_id: 'dummy_user_' + idx,
        employee_code: 'EMP' + String(idx).padStart(4, '0'),
        first_name: 'Test',
        last_name: 'User ' + idx,
        work_email: `test${idx}@company.com`,
        personal_email: `personal${idx}@test.com`,
        phone: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: 'OTHER',
        marital_status: 'SINGLE',
        blood_group: 'O+',
        status: 'ACTIVE',
        hire_date: new Date(),
        probation_end_date: new Date(),
        job_title: 'Tester',
        employment_type: 'FULL_TIME',
        base_salary: 50000,
        currency: 'USD',
        pay_frequency: 'MONTHLY',
        working_days: 5,
        working_hours: 40
      });
    }
    await prisma.employee.createMany({ data: batch });
    console.log(`Created batch ${i/batchSize + 1}`);
  }
  
  console.log('Finished creating employees.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
