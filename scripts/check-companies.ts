import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, company_id: true } });
  console.log('=== USERS ===');
  console.table(users);

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { employees: true, users: true } }
    }
  });
  console.log('=== COMPANIES ===');
  console.table(companies.map(c => ({
    id: c.id,
    name: c.name,
    employees: c._count.employees,
    users: c._count.users
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
