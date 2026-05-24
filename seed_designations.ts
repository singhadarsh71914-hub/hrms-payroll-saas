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
    for (const desig of DESIGNATIONS) {
      await prisma.designation.upsert({
        where: { id: `fixed-id-desig-${company.id}-${desig.name.replace(/\s+/g, '-')}` },
        update: {},
        create: {
          company_id: company.id,
          name: desig.name,
          level: desig.level
        }
      });
    }
  }

  console.log('Designations seeded successfully');
}

seed().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
