import prisma from './src/lib/prisma.ts';

async function run() {
  const company = await prisma.company.create({
    data: {
      name: 'Empty Company',
    }
  });

  // Test the service
  const { AttendanceService } = await import('./src/services/attendance.service.ts');
  const result = await AttendanceService.getIntelligenceDashboard(company.id);
  
  console.log(JSON.stringify(result, null, 2));

  await prisma.company.delete({ where: { id: company.id } });
}
run().catch(console.error).finally(() => prisma.$disconnect());
