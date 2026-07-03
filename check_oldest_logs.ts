
import prisma from './src/lib/prisma.ts';

async function checkOldest() {
  const oldest = await prisma.auditLog.findMany({
    orderBy: { created_at: 'asc' },
    take: 5
  });
  console.log('Oldest logs:', JSON.stringify(oldest, null, 2));
  await prisma.$disconnect();
}
checkOldest();
