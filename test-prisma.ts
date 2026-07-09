import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ adapter: null });
console.log('Prisma initialized successfully.');