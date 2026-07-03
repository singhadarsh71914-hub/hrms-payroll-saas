import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { employee: true }
  });
  console.log("Current users:");
  users.forEach(u => {
    console.log(`{
  id: '${u.id}',
  email: '${u.email}',
  employee_id: ${u.employee ? `'${u.employee.id}'` : 'null'},
  company_id: '${u.company_id}',
  role: '${u.role}'
}`);
  });
}
main().finally(() => prisma.$disconnect());
