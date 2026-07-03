import prisma from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
  const hash = await bcrypt.hash("password", 10);
  console.log("New hash:", hash);

  await prisma.user.updateMany({
    data: { password_hash: hash }
  });

  console.log("Updated password for ALL users");
}

main().finally(() => prisma.$disconnect());
