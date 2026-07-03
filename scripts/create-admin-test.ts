import prisma from '../src/lib/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Need to get or create a company to attach the user to
  let company = await prisma.company.findFirst();
  if (!company) {
      company = await prisma.company.create({
          data: {
              name: 'Test Corp',
              financial_year_start: 4
          }
      });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: 'admin_test@local.dev' } });
  if (existingUser) {
      await prisma.user.delete({ where: { email: 'admin_test@local.dev' } });
  }

  const user = await prisma.user.create({
    data: {
      email: 'admin_test@local.dev',
      password_hash: passwordHash,
      role: 'ADMIN',
      email_verified: true,
      is_active: true,
      company_id: company.id
    }
  });

  console.log("Created test user:", user.email);
}

main().finally(() => prisma.$disconnect());
