import prisma from './src/lib/prisma';

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
        employee_code: 'EMP' + String(idx).padStart(4, '0'),
        first_name: 'Test',
        last_name: 'User ' + idx,
        work_email: `test${idx}@company.com`,
        personal_email: `personal${idx}@test.com`,
        phone: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: 'OTHER',
        employment_status: 'ACTIVE',
        date_of_joining: new Date(),
        probation_end_date: new Date(),
        employment_type: 'FULL_TIME',
        notice_period_days: 30
      });
    }
    await prisma.employee.createMany({ data: batch });
    console.log(`Created batch ${Math.floor(i/batchSize) + 1}`);
  }
  
  console.log('Finished creating employees.');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
