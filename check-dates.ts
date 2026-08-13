import prisma from './src/lib/prisma.ts';
(async () => {
  const emps = await prisma.employee.findMany({ select: { date_of_joining: true, employment_status: true, date_of_leaving: true } });
  console.log('Total Employees:', emps.length);
  const byMonth: Record<string, number> = {};
  for (const e of emps) {
    const month = e.date_of_joining ? e.date_of_joining.toISOString().substring(0, 7) : 'none';
    byMonth[month] = (byMonth[month] || 0) + 1;
  }
  console.log('Hire dates distribution:', byMonth);
  await prisma.$disconnect();
})()
