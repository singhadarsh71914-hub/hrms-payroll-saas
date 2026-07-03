import prisma from './src/lib/prisma';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@e2e.com' } });
  console.log('--- USER QUERY RESULT ---');
  console.log(user);
}

main().finally(() => prisma.$disconnect());
