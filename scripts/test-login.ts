import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@e2e.com' }
    });

    if (!user) {
      console.log('FAIL: User not found');
      return;
    }

    const match = await bcrypt.compare('admin123', user.password_hash);
    if (match) {
      console.log('PASS: Password verification successful');
    } else {
      console.log('FAIL: Password mismatch');
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
