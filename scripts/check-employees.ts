import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function checkEmployees() {
  try {
    const count = await prisma.employee.count();
    console.log(`Total employees: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.employee.findMany({ take: 5, select: { id: true, first_name: true, last_name: true, company_id: true } });
      console.log('Sample rows:');
      console.table(sample);
    }
  } catch (err) {
    console.error('Error checking employees:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployees();
