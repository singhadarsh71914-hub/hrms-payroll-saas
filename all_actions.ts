
import prisma from './src/lib/prisma.ts';

async function checkAllActions() {
  const actions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action']
  });
  console.log('All Actions:', actions.map(a => a.action));
  await prisma.$disconnect();
}
checkAllActions();
