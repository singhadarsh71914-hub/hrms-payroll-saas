import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const [
  companies, users, employees, departments,
  salaryComponents, salaryStructures, taxSlabs,
  stateRules, payrollRuns
] = await Promise.all([
  prisma.company.count(),
  prisma.user.count(),
  prisma.employee.count(),
  prisma.department.count(),
  prisma.salaryComponent.count(),
  prisma.salaryStructure.count(),
  prisma.taxSlab.count(),
  prisma.stateComplianceRule.count(),
  prisma.payrollRun.count(),
]);

console.log(JSON.stringify({
  companies, users, employees, departments,
  salaryComponents, salaryStructures, taxSlabs,
  stateRules, payrollRuns
}, null, 2));

// Check admin user final state
const admin = await prisma.user.findUnique({
  where: { email: 'admin@e2e.com' },
  select: { id: true, email: true, role: true, email_verified: true, is_active: true, company_id: true }
});
console.log('Admin user:', JSON.stringify(admin, null, 2));

await prisma.$disconnect();
await pool.end();
