import prisma from './src/lib/prisma';

async function measure() {
  console.log('Testing Employee List Performance...');
  const company = await prisma.company.findFirst();
  const companyId = company?.id;

  if (!companyId) return;

  const queries = [
    { name: 'Employee List', sql: `EXPLAIN ANALYZE SELECT * FROM "Employee" WHERE "company_id" = '${companyId}' LIMIT 50 OFFSET 0` },
    { name: 'Attendance By Employee', sql: `EXPLAIN ANALYZE SELECT * FROM "Attendance" WHERE "employee_id" = '13b6ad81-97a1-42de-b9b0-6775da6d6b55'` },
    { name: 'Payroll By Employee', sql: `EXPLAIN ANALYZE SELECT * FROM "Payroll" WHERE "employee_id" = '13b6ad81-97a1-42de-b9b0-6775da6d6b55'` }
  ];

  for (const q of queries) {
    console.log(`\n--- ${q.name} ---`);
    const result = await prisma.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(q.sql);
    result.forEach(row => console.log(row['QUERY PLAN']));
  }
}

measure().catch(console.error).finally(() => prisma.$disconnect());
