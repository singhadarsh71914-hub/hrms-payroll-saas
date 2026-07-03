
import prisma from './src/lib/prisma.ts';

async function audit() {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        is_active: true
      }
    });

    const searchResults = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'adarsh@123.com' },
          { email: { contains: 'adarsh' } },
          { email: { contains: 'ADMIN-ADARSH' } }
        ]
      }
    });

    console.log('--- DATABASE CONSISTENCY AUDIT ---');
    console.log('Total Users:', totalUsers);
    console.log('\nAdmin Users:', JSON.stringify(adminUsers, null, 2));
    console.log('\nSearch Results for "adarsh":', JSON.stringify(searchResults, null, 2));
    console.log('\n--- END AUDIT ---');

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

audit();
