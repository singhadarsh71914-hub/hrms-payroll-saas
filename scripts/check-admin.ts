import prisma from '../src/lib/prisma.ts';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@e2e.com' },
    select: { id: true, email: true, role: true, email_verified: true, is_active: true, password_hash: true }
  });
  if (user) {
    user.password_hash = user.password_hash.substring(0, 20);
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log("Not found");
  }
}

main().finally(() => prisma.$disconnect());
