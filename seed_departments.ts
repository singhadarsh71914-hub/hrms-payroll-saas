import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG' },
  { name: 'HR', code: 'HR' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Sales', code: 'SLS' },
  { name: 'Operations', code: 'OPS' },
  { name: 'Management', code: 'MGMT' }
];

async function seed() {
  const companies = await prisma.company.findMany();
  
  if (companies.length === 0) {
    console.log('No companies found. Please register a company first.');
    return;
  }

  for (const company of companies) {
    console.log(`Seeding departments for company: ${company.name}`);
    const existing = await prisma.department.findMany({
      where: { company_id: company.id },
      select: { code: true },
    });
    const existingCodes = new Set(existing.map(d => d.code));
    const toCreate = DEPARTMENTS.filter(d => !existingCodes.has(d.code));
    if (toCreate.length === 0) {
      console.log(`  Already seeded — skipping.`);
      continue;
    }
    const result = await prisma.department.createMany({
      data: toCreate.map(d => ({ company_id: company.id, name: d.name, code: d.code })),
      skipDuplicates: true,
    });
    console.log(`  Created ${result.count} departments.`);
  }

  console.log('Departments seeded successfully');
}

seed().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
