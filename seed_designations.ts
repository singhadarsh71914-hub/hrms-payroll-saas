import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DESIGNATIONS = [
  { name: 'Junior Software Engineer', level: 1 },
  { name: 'Software Engineer', level: 2 },
  { name: 'Senior Software Engineer', level: 3 },
  { name: 'Technical Lead', level: 4 },
  { name: 'Manager', level: 5 },
  { name: 'Director', level: 6 }
];

async function seed() {
  const companies = await prisma.company.findMany();
  
  if (companies.length === 0) {
    console.log('No companies found. Please register a company first.');
    return;
  }

  for (const company of companies) {
    console.log(`Seeding designations for company: ${company.name}`);
    const existing = await prisma.designation.findMany({
      where: { company_id: company.id },
      select: { name: true },
    });
    const existingNames = new Set(existing.map(d => d.name));
    const toCreate = DESIGNATIONS.filter(d => !existingNames.has(d.name));
    if (toCreate.length === 0) {
      console.log(`  Already seeded — skipping.`);
      continue;
    }
    const result = await prisma.designation.createMany({
      data: toCreate.map(d => ({ company_id: company.id, name: d.name, level: d.level })),
      skipDuplicates: true,
    });
    console.log(`  Created ${result.count} designations.`);
  }

  console.log('Designations seeded successfully');
}

seed().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
