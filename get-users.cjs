const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log(JSON.stringify(users, null, 2));
}
run().finally(() => prisma.$disconnect());
