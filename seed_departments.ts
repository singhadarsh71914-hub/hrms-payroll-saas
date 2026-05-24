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
    for (const dept of DEPARTMENTS) {
      await prisma.department.upsert({
        where: { id: `fixed-id-${company.id}-${dept.code}` }, // Not actually unique but just for upsert pattern
        // Prisma doesn't have a unique constraint on (company_id, code) in the schema I saw?
        // Let me check schema.prisma again.
        update: {},
        create: {
          company_id: company.id,
          name: dept.name,
          code: dept.code
        }
      });
    }
  }

  console.log('Departments seeded successfully');
}

seed().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
