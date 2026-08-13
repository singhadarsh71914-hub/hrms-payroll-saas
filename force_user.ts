import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function forceUser() {
  const hash = await bcrypt.hash('password', 10);
  const user = await prisma.user.updateMany({
    where: { email: 'admin@e2e.com' },
    data: { password_hash: hash, role: 'ADMIN', is_active: true }
  });
  console.log('Force updated admin@e2e.com password to "password". Count:', user.count);
}
forceUser().finally(() => prisma.$disconnect());
