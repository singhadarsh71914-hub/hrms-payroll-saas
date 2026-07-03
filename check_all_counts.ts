
import prisma from './src/lib/prisma.ts';

async function checkAll() {
  const tables = ['Company', 'Department', 'Designation', 'Employee', 'Leave', 'Payroll', 'User', 'AuditLog'];
  for (const t of tables) {
    try {
      const c = await (prisma as any)[t.charAt(0).toLowerCase() + t.slice(1)].count();
      console.log(`${t}: ${c}`);
    } catch (e) {}
  }
  await prisma.$disconnect();
}
checkAll();
