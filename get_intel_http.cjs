const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function run() {
  const admin = await prisma.employee.findFirst({ where: { role: 'HR' } });
  if (!admin) return console.log('No HR user found');
  
  const token = jwt.sign({ userId: admin.id, role: admin.role, companyId: admin.company_id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
  
  const res = await fetch('http://localhost:3000/api/attendance/intelligence', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
