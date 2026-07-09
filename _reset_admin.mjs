import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Reset admin@e2e.com password to Admin@123456 and verify email
const newPassword = 'Admin@123456';
const hash = await bcrypt.hash(newPassword, 10);

const updated = await prisma.user.update({
  where: { email: 'admin@e2e.com' },
  data: {
    password_hash: hash,
    email_verified: true,
    is_active: true,
  },
  select: { id: true, email: true, role: true, email_verified: true, is_active: true }
});

console.log('Updated user:', JSON.stringify(updated, null, 2));

// Verify the hash works
const match = await bcrypt.compare(newPassword, hash);
console.log(`Password '${newPassword}' matches hash: ${match}`);

await prisma.$disconnect();
await pool.end();
console.log('Done.');
