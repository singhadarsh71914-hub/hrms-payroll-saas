import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ include: { employee: true }});
  for (const u of users) {
    console.log(u.role, u.email, u.id);
  }
}
run();
