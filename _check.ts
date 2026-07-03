import prisma from './src/lib/prisma.ts';

async function check() {
  const emp = await prisma.employee.findFirst({
    where: { user_id: { not: null } }
  });
  console.log("Employee with user_id:", emp);
  
  const allEmps = await prisma.employee.findMany();
  console.log("Total employees:", allEmps.length);
  console.log("Employees with user_id:", allEmps.filter(e => e.user_id !== null).length);

  const req = await prisma.leaveRequest.findFirst({
    orderBy: { start_date: 'desc' },
    include: { employee: true }
  });
  console.log("Latest leave request employee user_id:", req?.employee?.user_id);
}

check().then(() => process.exit(0));
