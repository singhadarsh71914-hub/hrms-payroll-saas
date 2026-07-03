
import prisma from './src/lib/prisma.ts';

async function audit() {
  const count = await prisma.employee.count();
  const sample = await prisma.employee.findMany({ take: 5 });
  console.log('Total Employees:', count);
  console.log('Sample Employees:', JSON.stringify(sample, null, 2));
  await prisma.$disconnect();
}
audit();
