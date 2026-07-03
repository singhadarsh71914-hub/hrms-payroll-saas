import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.ts';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const after = Date.now();
        const duration = after - before;
        if (duration > 500) {
          logger.warn('Slow Query Detected', {
            model,
            action: operation,
            duration,
            timestamp: new Date().toISOString()
          });
        }
        return result;
      }
    }
  }
});

export default prisma;
