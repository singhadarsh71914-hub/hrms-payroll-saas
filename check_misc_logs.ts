
import prisma from './src/lib/prisma.ts';

async function checkMiscLogs() {
  const logs = await prisma.auditLog.findMany({
    where: {
      NOT: [
        { action: 'LOGIN_FAILURE' },
        { action: 'LOGIN_SUCCESS' }
      ]
    },
    orderBy: { created_at: 'desc' }
  });
  console.log('Misc logs:', JSON.stringify(logs, null, 2));
  await prisma.$disconnect();
}
checkMiscLogs();
