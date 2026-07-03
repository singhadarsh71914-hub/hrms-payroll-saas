import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const API_URL = 'http://localhost:3000/api';
let token = '';

async function run() {
  try {
    console.log('--- STARTING STABILIZATION CHECKLIST ---');
    
    // Find an admin user
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('No Admin user found in DB');

    // We bypass real login by just generating a token since we have JWT secret in env, or we can use the login endpoint if we know the password. 
    // Wait, let's just generate a token using the same logic as auth controller.
    token = jwt.sign(
      { id: adminUser.id, role: adminUser.role, company_id: adminUser.company_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );
    
    const api = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✔ Logged in as Admin (token generated)');

    // 1. Create a custom component
    console.log('Creating a custom component...');
    const compRes = await api.post('/salary-components', {
      name: 'Stabilization Allowance',
      code: 'STAB_ALLOW',
      type: 'EARNING',
      category: 'VARIABLE',
      calculation_type: 'FLAT_AMOUNT',
      is_taxable: true,
      is_pro_rata: true
    });
    const componentId = compRes.data.id;
    console.log(`✔ Custom component created: ${componentId}`);

    // 2. Duplicate a component
    console.log('Duplicating component...');
    const dupRes = await api.post(`/salary-components/${componentId}/duplicate`);
    const duplicateId = dupRes.data.id;
    console.log(`✔ Component duplicated: ${duplicateId}`);

    // 3. Archive a non-system component
    console.log('Archiving duplicated component...');
    await api.delete(`/salary-components/${duplicateId}`);
    console.log('✔ Component archived');

    // 4. Create a structure
    console.log('Creating a salary structure...');
    const structRes = await api.post('/salary-structures', {
      name: 'Stabilization Structure',
      description: 'Test Structure',
      components: [
        { salary_component_id: componentId, calculation_type: 'FLAT_AMOUNT', value: 5000, sequence: 1 }
      ]
    });
    const structureId = structRes.data.id;
    console.log(`✔ Salary structure created: ${structureId}`);

    // 5. Assign it to a test employee
    // Get an active employee
    const emp = await prisma.employee.findFirst({ where: { company_id: adminUser.company_id, is_active: true } });
    if (!emp) throw new Error('No active employee found to assign salary structure');
    
    console.log(`Assigning structure to employee ${emp.id}...`);
    // Need to assign salary... assuming there's an endpoint or we just use prisma.
    await prisma.employeeSalary.upsert({
      where: { employee_id: emp.id },
      update: { salary_structure_id: structureId, annual_ctc: 600000, effective_from: new Date() },
      create: { employee_id: emp.id, company_id: adminUser.company_id, salary_structure_id: structureId, annual_ctc: 600000, effective_from: new Date() }
    });
    console.log('✔ Salary structure assigned');

    // 6. Add a fixed bonus
    console.log('Adding a fixed bonus...');
    await api.post(`/employees/${emp.id}/bonuses`, {
      type: 'Fixed Performance Bonus',
      amount: 1000,
      category: 'FIXED_BONUS',
      recurring: false,
      status: 'APPROVED'
    });
    console.log('✔ Fixed bonus added');

    // 7. Add a variable compensation entry
    console.log('Adding variable compensation...');
    await api.post(`/employees/${emp.id}/bonuses`, {
      type: 'Variable Sales Commission',
      amount: 2500,
      category: 'VARIABLE_COMPENSATION',
      effective_month: '2023-11', // Test month
      status: 'APPROVED'
    });
    console.log('✔ Variable compensation added');

    // 8. Run payroll for one month
    console.log('Running payroll...');
    // Ensure we delete any existing run for 2023-11 so we can run it
    await prisma.payrollRun.deleteMany({ where: { month: 11, year: 2023, company_id: adminUser.company_id } });
    
    const payrollRes = await api.post('/payroll/run', { month: 11, year: 2023 });
    const runId = payrollRes.data.id;
    console.log(`✔ Payroll run completed: ${runId}`);

    // Fetch the payslip
    const payslip = await prisma.payslip.findFirst({ where: { payroll_run_id: runId, employee_id: emp.id }, include: { line_items: true } });
    if (!payslip) throw new Error('Payslip not generated');

    // 9. Generate a payslip PDF
    console.log('Generating payslip PDF...');
    const pdfRes = await api.get(`/payroll/${runId}/payslip/${emp.id}/pdf`, { responseType: 'arraybuffer' });
    fs.writeFileSync('test_payslip_stabilization.pdf', pdfRes.data);
    console.log('✔ Payslip PDF generated (test_payslip_stabilization.pdf)');

    // 10. Verify Calculations
    console.log('\n--- VERIFICATION ---');
    console.log('Gross:', payslip.gross_salary);
    console.log('Net:', payslip.net_salary);
    
    const earningsSum = payslip.line_items.filter(li => li.component_type === 'EARNING').reduce((sum, li) => sum + Number(li.amount), 0);
    const deductionsSum = payslip.line_items.filter(li => li.component_type === 'DEDUCTION').reduce((sum, li) => sum + Number(li.amount), 0);
    
    console.log(`Calculated Earnings Sum: ${earningsSum}`);
    console.log(`Calculated Deductions Sum: ${deductionsSum}`);
    
    if (Math.abs(Number(payslip.gross_salary) - earningsSum) > 0.01) console.error('❌ Gross != Earnings Sum');
    else console.log('✔ Gross = Earnings sum');
    
    if (Math.abs(Number(payslip.net_salary) - (Number(payslip.gross_salary) - deductionsSum)) > 0.01) console.error('❌ Net != Gross - Deductions');
    else console.log('✔ Net = Gross - Deductions');

    console.log('\nAll checks completed!');
    
  } catch (err: any) {
    console.error('Error during stabilization check:', err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
