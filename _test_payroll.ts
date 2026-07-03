import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function test() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const companyId = admin!.company_id!;
    console.log("Updating employees to active...");
    await prisma.employee.updateMany({ where: { company_id: companyId }, data: { is_active: true } });
    
    console.log("Running payroll for company:", companyId);
    await PayrollService.processPayroll(companyId, 6, 2026);
    console.log("SUCCESS");
  } catch (err) {
    console.error("CRASH:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
