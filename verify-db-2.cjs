const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}); // Just in case, I'll bypass this error by checking how it's done in lib/prisma.ts or just running it directly in a ts-node script.
