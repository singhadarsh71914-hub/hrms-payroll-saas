
import prisma from './src/lib/prisma.ts';

async function listActions() {
  const actions = await prisma.auditLog.groupBy({ by: ['action'] });
  console.log('Actions:', actions.map(a => a.action));
  await prisma.$disconnect();
}
listActions();
