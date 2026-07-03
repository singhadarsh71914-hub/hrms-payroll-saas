import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import jwt from 'jsonwebtoken';

async function run() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
      console.log('No admin user found');
      return;
    }
    const token = jwt.sign(
      { id: user.id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET || 'supersecretjwtkey',
      { expiresIn: '1h' }
    );
    const headers = { Authorization: 'Bearer ' + token };
    
    let res = await fetch('http://localhost:3000/api/attendance/intelligence', { headers });
    console.log('--- GET /intelligence ---');
    console.log(await res.json());

    res = await fetch('http://localhost:3000/api/attendance/live', { headers });
    console.log('--- GET /live ---');
    console.log(await res.json());

    res = await fetch('http://localhost:3000/api/attendance/risks', { headers });
    console.log('--- GET /risks ---');
    console.log(await res.json());

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
