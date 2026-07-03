import prisma from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@e2e.com' }
  });
  if (user) {
    const match = await bcrypt.compare('password', user.password_hash);
    console.log(`MATCH: ${match}`);
    
    if (!match) {
        const newHash = await bcrypt.hash('password', 10);
        await prisma.user.update({
            where: { email: 'admin@e2e.com' },
            data: { password_hash: newHash }
        });
        console.log("Generated new hash");
        const userAgain = await prisma.user.findUnique({ where: { email: 'admin@e2e.com' }});
        const matchAgain = await bcrypt.compare('password', userAgain!.password_hash);
        console.log(`MATCH: ${matchAgain}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
