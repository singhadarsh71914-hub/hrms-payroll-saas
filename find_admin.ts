import prisma from './src/lib/prisma';
async function main() {
  const users = await prisma.user.findMany({ where: { role: 'ADMIN' }, take: 10 });
  console.log(users.map(u => u.email));
}
main().finally(() => prisma.$disconnect());
