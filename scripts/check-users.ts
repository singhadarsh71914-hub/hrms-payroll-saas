import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function check() {
  try {
    const companies = await prisma.company.findMany({ select: { id: true, name: true } });
    console.log('=== COMPANIES ===');
    console.table(companies);

    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, company_id: true } });
    console.log('=== USERS ===');
    console.table(users);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
