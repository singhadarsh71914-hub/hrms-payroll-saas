import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('Starting 10,000 employee benchmark...');
  
  // Seed company
  const company = await prisma.company.create({
    data: { name: 'Benchmark Corp', domain: 'bench.com', industry: 'Tech', size: '1000+' }
  });
  
  const companyId = company.id;

  // Seed employees
  console.log('Seeding 10k employees...');
  const employees = [];
  for(let i=0; i<10000; i++) {
    employees.push({
      company_id: companyId,
      employee_code: 'B' + i,
      first_name: 'Bench',
      last_name: 'Mark ' + i,
      email: 'bench' + i + '@bench.com',
      date_of_joining: new Date(),
      designation: 'Tester',
      employment_status: 'ACTIVE',
      base_salary: 50000,
      currency: 'INR'
    });
  }
  
  // Batch insert
  const batchSize = 2500;
  for (let i=0; i<employees.length; i+=batchSize) {
    await prisma.employee.createMany({
      data: employees.slice(i, i+batchSize)
    });
    console.log(`Inserted ${i+batchSize} employees`);
  }

  console.log('Seeding PayrollRun and 10k Payslips...');
  const run = await prisma.payrollRun.create({
    data: {
      company_id: companyId,
      month: 7,
      year: 2026,
      status: 'COMPLETED',
      total_gross: 500000000,
      total_net: 450000000,
      total_deductions: 50000000,
      total_employer_contributions: 10000000,
      processed_by: 'system'
    }
  });

  const allEmps = await prisma.employee.findMany({ where: { company_id: companyId }, select: { id: true } });
  const payslips = allEmps.map(e => ({
    payroll_run_id: run.id,
    employee_id: e.id,
    gross_salary: 50000,
    net_salary: 45000,
    deductions: 5000,
    status: 'GENERATED'
  }));
  
  for (let i=0; i<payslips.length; i+=batchSize) {
    await prisma.payrollPayslip.createMany({
      data: payslips.slice(i, i+batchSize)
    });
    console.log(`Inserted ${i+batchSize} payslips`);
  }

  console.log('Testing streaming CSV extraction...');
  const fastCsv = await import('fast-csv');
  const format = fastCsv.format;
  
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();
  
  const filepath = path.join(process.cwd(), `benchmark_${Date.now()}.csv`);
  const writeStream = fs.createWriteStream(filepath);
  const csvStream = format({ headers: true });
  csvStream.pipe(writeStream);
  
  let lastId = '';
  const take = 1000;
  let hasMore = true;

  while (hasMore) {
    const batch = await prisma.$queryRaw`SELECT p.id as row_id, p.employee_id, e.employee_code, e.first_name, e.last_name, p.gross_salary, p.net_salary FROM "PayrollPayslip" p JOIN "Employee" e ON p.employee_id = e.id JOIN "PayrollRun" r ON p.payroll_run_id = r.id WHERE r.company_id = ${companyId} AND p.id > ${lastId} ORDER BY p.id ASC LIMIT ${take}`;
    
    for (const row of batch) {
      lastId = row.row_id;
      const safeRow = {};
      for (const [key, val] of Object.entries(row)) {
         if (key === 'row_id') continue;
         safeRow[key] = typeof val === 'bigint' ? Number(val) : val;
      }
      csvStream.write(safeRow);
    }
    
    if (batch.length < take) {
      hasMore = false;
    }
  }
  
  csvStream.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));
  
  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const stat = fs.statSync(filepath);
  
  console.log('--- BENCHMARK RESULTS ---');
  console.log(`Execution Time: ${((endTime - startTime)/1000).toFixed(2)} seconds`);
  console.log(`Peak Memory Overhead: ${((endMemory - startMemory)/1024/1024).toFixed(2)} MB`);
  console.log(`Generated CSV Size: ${(stat.size/1024/1024).toFixed(2)} MB`);
  
  // Cleanup
  await prisma.payrollPayslip.deleteMany({ where: { payroll_run_id: run.id } });
  await prisma.payrollRun.deleteMany({ where: { id: run.id } });
  await prisma.employee.deleteMany({ where: { company_id: companyId } });
  await prisma.company.delete({ where: { id: companyId } });
  
  fs.unlinkSync(filepath);
  console.log('Cleanup complete.');
  process.exit(0);
}

runBenchmark().catch(console.error);
