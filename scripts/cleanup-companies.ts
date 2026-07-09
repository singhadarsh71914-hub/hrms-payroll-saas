import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { employees: true, users: true }
      }
    }
  });

  let deleted = 0;
  for (const c of companies) {
    if (c._count.employees === 0 && c._count.users === 0) {
      await prisma.company.delete({ where: { id: c.id } });
      deleted++;
    }
  }

  console.log(`Cleanup complete. Deleted ${deleted} orphaned companies.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
