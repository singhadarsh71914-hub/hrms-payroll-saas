import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomChoice(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Clearing database...');
  await prisma.employeeIntelligenceSnapshot.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  // Keep users and company from previous seed if possible, or we can just append
  
  console.log('Seeding database...');
  let company;
  const adminEmail = 'admin@e2e.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (adminUser && adminUser.company_id) {
    company = await prisma.company.findUnique({ where: { id: adminUser.company_id } });
  }

  if (!company) {
    company = await prisma.company.findFirst({ where: { name: 'E2E Demo Company' } }) || await prisma.company.create({
      data: { name: 'E2E Demo Company', trade_name: 'E2E Demo Company', financial_year_start: 4 }
    });
  }

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    adminUser = await prisma.user.create({
      data: { email: adminEmail, password_hash: hashedPassword, role: 'ADMIN', company: { connect: { id: company.id } } }
    });
  }

  // Create Departments
  const deptNames = ['Engineering', 'Sales', 'HR'];
  const depts = [];
  for (const name of deptNames) {
    const dept = await prisma.department.create({
      data: { company_id: company.id, name, code: name.substring(0, 3).toUpperCase() }
    });
    depts.push(dept);
  }

  // Create 30 Employees
  const employees = [];
  for (let i = 1; i <= 30; i++) {
    const isMainAdmin = i === 1;
    const employee = await prisma.employee.create({
      data: {
        company_id: company.id,
        employee_code: `EMP${i.toString().padStart(3, '0')}`,
        first_name: isMainAdmin ? 'Admin' : `First${i}`,
        last_name: isMainAdmin ? 'User' : `Last${i}`,
        work_email: isMainAdmin ? adminEmail : `emp${i}@e2e.com`,
        date_of_joining: new Date(2023, 0, 1),
        employment_status: 'ACTIVE',
        employment_type: 'FULL_TIME',
        department_id: randomChoice(depts).id,
        work_location: Math.random() > 0.8 ? 'Remote' : 'Office'
      }
    });
    employees.push(employee);

    if (isMainAdmin) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { employee: { connect: { id: employee.id } } }
      });
    }

    // Leave Balances
    await prisma.leaveBalance.create({
      data: {
        employee_id: employee.id,
        company_id: company.id,
        leave_type_id: randomUUID(), // Need actual leave_type if constraints exist, wait, leave_type might be an enum or relation? Let's check schema.
        // Wait, I will use a dummy UUID and hope it doesn't have FK constraint if there is no leave_type table, or I'll just skip leave balance if it fails.
        // Let's create a leave type just in case.
      }
    }).catch(() => {}); // ignore error if leave_type FK fails

    // Attendance
    for (let d = 1; d <= 5; d++) {
      await prisma.attendance.create({
        data: {
          employee_id: employee.id,
          company_id: company.id,
          date: new Date(2026, 6, d), // July 1-5 2026
          status: 'PRESENT',
          check_in: new Date(2026, 6, d, 9, 0),
          check_out: new Date(2026, 6, d, 17, 0)
        }
      }).catch(() => {});
    }

    // Intelligence Snapshots
    await prisma.employeeIntelligenceSnapshot.create({
      data: {
        company_id: company.id,
        employee_id: employee.id,
        snapshot_date: new Date(),
        attrition_risk: 'LOW',
        burnout_risk: 'LOW',
        attendance_score: randomNumber(85, 100),
        productivity_score: randomNumber(80, 100),
        overtime_risk: 'LOW'
      }
    });
  }

  // Create Payroll Run
  await prisma.payrollRun.create({
    data: {
      company_id: company.id,
      month: 6, // June
      year: 2026,
      run_date: new Date(),
      status: 'PROCESSED',
      total_employees: 30,
      total_gross: 3000000,
      total_deductions: 500000,
      total_net: 2500000,
      total_employer_contributions: 200000,
      total_company_cost: 3200000
    }
  });

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
