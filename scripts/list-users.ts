import prisma from '../src/lib/prisma.ts';
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => u.email));
}
main().finally(() => prisma.$disconnect());
