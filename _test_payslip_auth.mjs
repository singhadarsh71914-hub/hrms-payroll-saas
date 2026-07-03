import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function runAttacks() {
  console.log('--- Setting up test data ---');
  
  // 1. Create Company A and Company B
  const companyA = await prisma.company.create({ data: { name: 'Comp A', subdomain: 'compa' + Date.now() } });
  const companyB = await prisma.company.create({ data: { name: 'Comp B', subdomain: 'compb' + Date.now() } });

  // 2. Create Employees in Company A
  // Manager A
  const userMgrA = await prisma.user.create({ data: { email: 'mgrA' + Date.now() + '@a.com', password_hash: '123', role: 'MANAGER', company_id: companyA.id } });
  const empMgrA = await prisma.employee.create({ data: { user_id: userMgrA.id, company_id: companyA.id, first_name: 'Mgr', last_name: 'A', employee_code: 'MGR_A', date_of_joining: new Date(), base_salary: 1000 } });
  
  // Employee 1 (Reports to Manager A)
  const userEmp1 = await prisma.user.create({ data: { email: 'emp1' + Date.now() + '@a.com', password_hash: '123', role: 'EMPLOYEE', company_id: companyA.id } });
  const emp1 = await prisma.employee.create({ data: { user_id: userEmp1.id, company_id: companyA.id, first_name: 'Emp', last_name: '1', employee_code: 'EMP_1', date_of_joining: new Date(), base_salary: 1000, manager_id: empMgrA.id } });

  // Employee 2 (Does NOT report to Manager A)
  const userEmp2 = await prisma.user.create({ data: { email: 'emp2' + Date.now() + '@a.com', password_hash: '123', role: 'EMPLOYEE', company_id: companyA.id } });
  const emp2 = await prisma.employee.create({ data: { user_id: userEmp2.id, company_id: companyA.id, first_name: 'Emp', last_name: '2', employee_code: 'EMP_2', date_of_joining: new Date(), base_salary: 1000 } });

  // 3. Create Employee in Company B
  const userEmpB = await prisma.user.create({ data: { email: 'empB' + Date.now() + '@b.com', password_hash: '123', role: 'EMPLOYEE', company_id: companyB.id } });
  const empB = await prisma.employee.create({ data: { user_id: userEmpB.id, company_id: companyB.id, first_name: 'Emp', last_name: 'B', employee_code: 'EMP_B', date_of_joining: new Date(), base_salary: 1000 } });

  // 4. Create a dummy Payroll Run & Payslips for Emp1, Emp2, EmpB
  const runA = await prisma.payrollRun.create({ data: { company_id: companyA.id, month: 6, year: 2026, status: 'COMPLETED' } });
  const runB = await prisma.payrollRun.create({ data: { company_id: companyB.id, month: 6, year: 2026, status: 'COMPLETED' } });
  
  const payslipEmp1 = await prisma.payslip.create({ data: { run_id: runA.id, employee_id: emp1.id, month: 6, year: 2026, gross_salary: 1000, net_salary: 1000, total_deductions: 0 } });
  const payslipEmp2 = await prisma.payslip.create({ data: { run_id: runA.id, employee_id: emp2.id, month: 6, year: 2026, gross_salary: 1000, net_salary: 1000, total_deductions: 0 } });
  const payslipEmpB = await prisma.payslip.create({ data: { run_id: runB.id, employee_id: empB.id, month: 6, year: 2026, gross_salary: 1000, net_salary: 1000, total_deductions: 0 } });

  // Tokens
  const secret = process.env.JWT_SECRET || 'super-secret-jwt-key';
  const getHeaders = (user, emp) => ({
    'Authorization': 'Bearer ' + jwt.sign({ id: user.id, email: user.email, role: user.role, company_id: user.company_id, employee_id: emp.id }, secret, { expiresIn: '1h' })
  });

  const tests = [
    { name: 'Attack A: No JWT token', url: `/api/payroll/${runA.id}/payslip/${emp1.id}`, headers: {} },
    { name: 'Attack B: Employee A requesting Employee B payslip', url: `/api/payroll/${runA.id}/payslip/${emp2.id}`, headers: getHeaders(userEmp1, emp1) },
    { name: 'Attack C: Manager requesting unrelated employee payslip', url: `/api/payroll/${runA.id}/payslip/${emp2.id}`, headers: getHeaders(userMgrA, empMgrA) },
    { name: 'Attack D: Cross-company access attempt', url: `/api/payroll/${runB.id}/payslip/${empB.id}`, headers: getHeaders(userEmp1, emp1) }
  ];

  for (const t of tests) {
    console.log(`\nTesting: ${t.name}`);
    console.log(`URL: ${t.url}`);
    try {
      const res = await fetch(`http://localhost:3000${t.url}`, { headers: t.headers });
      const text = await res.text();
      let pass = false;
      if (t.name === 'Attack A: No JWT token' && res.status === 401) pass = true;
      if (t.name !== 'Attack A: No JWT token' && res.status === 403) pass = true;
      
      console.log(`Status code: ${res.status}`);
      console.log(`Response body snippet: ${text.substring(0, 50)}...`);
      console.log(`Result: ${pass ? 'PASS (Secure)' : 'FAIL (Vulnerable)'}`);
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}
runAttacks();
