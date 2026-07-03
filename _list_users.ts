import prisma from './src/lib/prisma.ts';
const users = await prisma.user.findMany({ 
  select: { email: true, role: true },
  take: 10
});
console.log('Users in DB:');
console.log(JSON.stringify(users, null, 2));
process.exit(0);
