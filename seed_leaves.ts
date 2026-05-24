import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const employees = await prisma.employee.findMany({ take: 3 });
  if (employees.length === 0) {
    console.log('No employees found to seed leaves');
    return;
  }

  const year = new Date().getFullYear();

  for (const emp of employees) {
    // Initialize balances
    const leaveTypes = ['CASUAL', 'SICK', 'ANNUAL'];
    for (const type of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employee_id_leave_type_year: {
            employee_id: emp.id,
            leave_type: type,
            year
          }
        },
        update: {},
        create: {
          employee_id: emp.id,
          leave_type: type,
          total_days: type === 'ANNUAL' ? 15 : 12,
          balance_days: type === 'ANNUAL' ? 15 : 12,
          year
        }
      });
    }

    // Create a pending request
    await prisma.leaveRequest.create({
      data: {
        employee_id: emp.id,
        leave_type: 'CASUAL',
        start_date: new Date(year, 5, 10),
        end_date: new Date(year, 5, 12),
        total_days: 3,
        reason: 'Family function',
        status: 'PENDING'
      }
    });

    // Create an approved request
    await prisma.leaveRequest.create({
      data: {
        employee_id: emp.id,
        leave_type: 'SICK',
        start_date: new Date(year, 4, 15),
        end_date: new Date(year, 4, 16),
        total_days: 2,
        reason: 'Fever',
        status: 'APPROVED',
        approved_by: 'admin@example.com',
        approved_at: new Date()
      }
    });

    // Manually deduct balance for approved request in seed
    await prisma.leaveBalance.update({
      where: {
        employee_id_leave_type_year: {
          employee_id: emp.id,
          leave_type: 'SICK',
          year
        }
      },
      data: {
        used_days: { increment: 2 },
        balance_days: { decrement: 2 }
      }
    });
  }

  console.log('Seed completed successfully');
}

seed().catch(e => console.error(e)).finally(() => {
  prisma.$disconnect();
  pool.end();
});
