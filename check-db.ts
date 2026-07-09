import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
async function main() {
  const companies = await prisma.company.count();
  console.log('Companies:', companies);
}
main().catch(console.error).finally(() => process.exit(0));