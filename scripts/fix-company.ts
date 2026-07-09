import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@e2e.com' } });
  if (!admin || !admin.company_id) {
    console.error('Admin not found or has no company');
    return;
  }
  const targetCompanyId = admin.company_id;

  const result = await prisma.$transaction(async (tx) => {
    // We update anything that belongs to any company to targetCompanyId
    // Because we just want them all to merge to the admin's company.
    const deptUpdate = await tx.department.updateMany({
      where: { company_id: { not: targetCompanyId } },
      data: { company_id: targetCompanyId }
    });

    const empUpdate = await tx.employee.updateMany({
      where: { company_id: { not: targetCompanyId } },
      data: { company_id: targetCompanyId }
    });

    const payUpdate = await tx.payrollRun.updateMany({
      where: { company_id: { not: targetCompanyId } },
      data: { company_id: targetCompanyId }
    });

    const intelUpdate = await tx.employeeIntelligenceSnapshot.updateMany({
      where: { company_id: { not: targetCompanyId } },
      data: { company_id: targetCompanyId }
    });

    return {
      departments: deptUpdate.count,
      employees: empUpdate.count,
      payroll: payUpdate.count,
      snapshots: intelUpdate.count,
    };
  });

  console.log('Migration complete. Updated counts:');
  console.log(result);
}

main().catch(console.error).finally(() => prisma.$disconnect());
