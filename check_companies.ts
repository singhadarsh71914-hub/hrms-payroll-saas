
import prisma from './src/lib/prisma.ts';

async function checkCompanies() {
  const companies = await prisma.company.findMany();
  console.log('Companies:', JSON.stringify(companies, null, 2));
  await prisma.$disconnect();
}
checkCompanies();
