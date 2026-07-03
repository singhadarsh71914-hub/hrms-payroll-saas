import prisma from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'singhadarsh71914@gmail.com' }
  });
  if (!user) {
    console.log("User not found");
    return;
  }
  const match = await bcrypt.compare('password', user.password_hash);
  console.log("bcrypt result for 'password':", match ? "TRUE" : "FALSE");
}
main().finally(() => prisma.$disconnect());
