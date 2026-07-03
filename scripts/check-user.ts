import prisma from '../src/lib/prisma.ts';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'singhadarsh71914@gmail.com' },
    select: { id: true, email: true, role: true, email_verified: true, is_active: true }
  });
  console.log("User:", JSON.stringify(user, null, 2));
}

main().finally(() => prisma.$disconnect());
