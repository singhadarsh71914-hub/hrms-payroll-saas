
import prisma from './src/lib/prisma.ts';

async function checkSuccess() {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'LOGIN_SUCCESS' },
      include: { user: true },
      orderBy: { created_at: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuccess();
