import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import jwt from 'jsonwebtoken';

async function test() {
  const adminEmail = 'adarsh@123.com';
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!adminUser) {
    console.log("Admin user not found!");
    return;
  }

  const token = jwt.sign(
    { id: adminUser.id, role: adminUser.role, company_id: adminUser.company_id },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '1h' }
  );
  
  const annRes = await fetch('http://localhost:3000/api/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ title: 'Test from script', content: 'Test content', priority: 'IMPORTANT' })
  });

  console.log('--- POST ANNOUNCEMENT VERIFICATION ---');
  console.log('STATUS:', annRes.status);
  console.log('BODY:', await annRes.text());
}
test();
