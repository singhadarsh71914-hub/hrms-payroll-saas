import { PrismaClient } from '@prisma/client';
import { LeaveService } from './src/services/leave.service.ts';

const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'emp@e2e.com' }, include: { employee: true } });
    if (!user || !user.employee) {
      console.error('User or employee not found');
      process.exit(1);
    }
    const leave = await LeaveService.applyLeave(user.employee.id, {
      leaveType: 'ANNUAL',
      startDate: '2026-07-01',
      endDate: '2026-07-02',
      reason: 'Test'
    });
    console.log('Success:', leave);
  } catch (err) {
    console.error('APPLY_LEAVE_ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
