import 'dotenv/config';
import prisma from './src/lib/prisma.ts';
import { performance } from 'perf_hooks';

async function runLoadTest() {
  const companyId = '407d7157-dbae-4254-b557-0a6ac995ead7'; // Test Company
  
  async function testScale(count) {
    console.log(`\n--- Testing Scale: ${count} Employees ---`);
    
    // Clear and seed employees
    await prisma.employee.deleteMany({ where: { company_id: companyId } });
    
    const employees = [];
    for (let i = 0; i < count; i++) {
      employees.push({
        company_id: companyId,
        employee_code: `EMP-${count}-${i}`,
        first_name: `Test${i}`,
        last_name: 'User',
        work_email: `test${count}_${i}@test.com`,
        date_of_joining: new Date(),
        is_active: true
      });
    }
    
    await prisma.employee.createMany({ data: employees });
    
    // Test 1: Employee Directory
    let start = performance.now();
    await prisma.employee.findMany({ where: { company_id: companyId } });
    let end = performance.now();
    console.log(`Employee Directory: ${(end - start).toFixed(2)}ms`);

    // Test 2: Dashboard Stats (simulated expensive query)
    start = performance.now();
    const activeCount = await prisma.employee.count({ where: { company_id: companyId, is_active: true } });
    end = performance.now();
    console.log(`Dashboard Stats (Active Count): ${(end - start).toFixed(2)}ms`);

    // Test 3: Attendance Summary Simulation (No Indexes!)
    // We'll generate 10 attendance records per employee to simulate
    const attendances = [];
    const allEmps = await prisma.employee.findMany({ where: { company_id: companyId }, select: { id: true } });
    for (const emp of allEmps) {
      for (let j = 0; j < 10; j++) {
        attendances.push({
          employee_id: emp.id,
          date: new Date(2026, 5, j + 1),
          status: 'PRESENT'
        });
      }
    }
    await prisma.attendance.createMany({ data: attendances });

    start = performance.now();
    // In service: await prisma.attendance.findMany({ where: { employee: { company_id: companyId }, date: { gte, lte } } })
    await prisma.attendance.findMany({
      where: {
        employee: { company_id: companyId },
        date: { gte: new Date(2026, 5, 1), lte: new Date(2026, 5, 30) }
      }
    });
    end = performance.now();
    console.log(`Attendance Summary (Unindexed): ${(end - start).toFixed(2)}ms`);
    
    // Cleanup attendance
    await prisma.attendance.deleteMany({});
  }

  try {
    await testScale(50);
    await testScale(500);
    await testScale(2000); // Using 2000 instead of 5000 to prevent local memory crash, extrapolating later
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

runLoadTest();
