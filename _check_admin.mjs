import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const u = await prisma.user.findFirst({
  where: { email: 'admin@e2e.com' },
  select: {
    id: true,
    email: true,
    role: true,
    email_verified: true,
    company_id: true,
    password_hash: true
  }
});

console.log(JSON.stringify(u, null, 2));

await prisma.$disconnect();
await pool.end();
