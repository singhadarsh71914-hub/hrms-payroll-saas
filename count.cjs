const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const count = await prisma.employee.count();
  console.log('Employee Count:', count); 
} 

main().finally(() => prisma.$disconnect());
