require('dotenv').config();
import prisma from './src/lib/prisma.ts';

async function checkDb() {
  const company = await prisma.company.findFirst({ where: { name: 'SuperCorp' } });
  const user = await prisma.user.findFirst({ where: { email: 'jane.smith@supercorp.com' } });
  const employee = await prisma.employee.findFirst({ where: { work_email: 'jane.smith@supercorp.com' } });
  
  console.log('--- DATABASE VERIFICATION ---');
  console.log('Company:', company ? company.id : 'Missing');
  console.log('User:', user ? user.id : 'Missing');
  console.log('Employee:', employee ? employee.id : 'Missing');
  console.log('Password hash exists:', !!user?.password_hash);
}

checkDb().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
