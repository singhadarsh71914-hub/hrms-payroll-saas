import prisma from './src/lib/prisma.ts';

async function testHeadcountLogic() {
  const company_id = (await prisma.company.findFirst()).id;
  const now = new Date();
  const months = 6;
  const data = [];

  const earliestEmp = await prisma.employee.findFirst({
    where: { company_id },
    orderBy: { date_of_joining: 'asc' },
    select: { date_of_joining: true }
  });

  const earliestMonth = earliestEmp?.date_of_joining ? new Date(earliestEmp.date_of_joining.getFullYear(), earliestEmp.date_of_joining.getMonth(), 1) : new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Skip months before the company had any employees
    if (d < earliestMonth && d.getTime() !== earliestMonth.getTime()) {
      continue;
    }

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const count = await prisma.employee.count({
      where: {
        company_id,
        date_of_joining: { lte: endOfMonth },
        OR: [
          { employment_status: 'ACTIVE' },
          { date_of_leaving: { gt: endOfMonth } }
        ]
      }
    });
    
    data.push({
      name: d.toLocaleString('default', { month: 'short' }),
      count,
      month: d.toLocaleString('default', { month: 'short' })
    });
  }
  
  console.log('Resulting Data:', data);
  await prisma.$disconnect();
}

testHeadcountLogic();
