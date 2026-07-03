
import prisma from './src/lib/prisma.ts';

async function checkAudit() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { metadata: { path: ['email'], equals: 'adarsh@123.com' } },
          { action: 'LOGIN_SUCCESS' }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudit();
