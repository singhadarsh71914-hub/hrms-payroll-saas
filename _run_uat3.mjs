import pg from 'pg';
import jwt from 'jsonwebtoken';
import http from 'http';
import fs from 'fs';

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });

async function runAudit() {
  await client.connect();

  const res = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'ADMIN' 
    LIMIT 1
  `);
  
  if (res.rows.length === 0) {
    console.error("No admin user found in DB.");
    process.exit(1);
  }
  const admin = res.rows[0];

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, company_id: admin.company_id, employee_id: admin.employee_id },
    'your_super_secret_jwt_key_change_this_in_production',
    { expiresIn: '1h' }
  );

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function req(method, path, body = null, customHeaders = null) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: method,
        headers: customHeaders || headers
      };
      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve({ status: response.statusCode, data }));
      });
      request.on('error', (err) => resolve({ status: 500, data: err.message }));
      if (body) {
         if (typeof body === 'string' || Buffer.isBuffer(body)) {
             request.write(body);
         } else {
             request.write(JSON.stringify(body));
         }
      }
      request.end();
    });
  }

  const results = [];

  async function test(workflow, action, method, path, body = null, customHeaders = null) {
    const result = await req(method, path, body, customHeaders);
    const pass = result.status >= 200 && result.status < 400;
    results.push({ workflow, action, status: result.status, pass });
    console.log(`[${workflow}] ${action} -> HTTP ${result.status} [${pass ? 'PASS' : 'FAIL'}]`);
    if (!pass) console.log(`   Error: ${result.data.substring(0, 100)}`);
    return result;
  }

  // 1. Employee
  const createEmpData = {
    employee_code: `EMP-${Date.now()}`,
    first_name: 'Test',
    last_name: 'User',
    work_email: `test${Date.now()}@test.com`,
    employment_status: 'ACTIVE',
    date_of_joining: '2026-06-01'
  };
  const empRes = await test('Employee', 'Create Employee', 'POST', '/employees', createEmpData);
  let newEmpId = null;
  if (empRes.status === 201) {
    newEmpId = JSON.parse(empRes.data).id;
  }

  if (newEmpId) {
    await test('Employee', 'Edit Employee', 'PUT', `/employees/${newEmpId}`, { first_name: 'Updated' });
    await test('Employee', 'View Employee Details', 'GET', `/employees/${newEmpId}`);
    await test('Employee', 'Deactivate Employee', 'DELETE', `/employees/${newEmpId}`);
    await test('Employee', 'Restore Employee', 'POST', `/employees/${newEmpId}/restore`);
  }

  const validEmpId = newEmpId || admin.employee_id;

  // 2. Attendance
  const attData = { employeeId: validEmpId, date: new Date().toISOString(), status: 'PRESENT' };
  await test('Attendance', 'Mark Attendance', 'POST', '/attendance/mark', attData);
  await test('Attendance', 'Attendance Summary', 'GET', '/attendance/summary?month=6&year=2026');
  await test('Attendance', 'Attendance Report', 'GET', '/attendance/report?month=6&year=2026');
  await test('Dashboard', 'Dashboard Loads', 'GET', '/dashboard/stats');

  // 3. Leave
  const leaveData = { leaveType: 'CASUAL', startDate: '2026-06-25', endDate: '2026-06-26', reason: 'UAT Test', employeeId: validEmpId };
  const leaveApplyRes = await test('Leave', 'Apply Leave', 'POST', '/leave/apply', leaveData);
  let leaveReqId = null;
  if (leaveApplyRes.status === 201) {
    leaveReqId = JSON.parse(leaveApplyRes.data).id;
  } else {
    const listReqs = await req('GET', '/leave/requests');
    if (listReqs.status === 200 && JSON.parse(listReqs.data).length > 0) leaveReqId = JSON.parse(listReqs.data)[0].id;
  }
  if (leaveReqId) await test('Leave', 'Approve Leave', 'PATCH', `/leave/requests/${leaveReqId}/status`, { status: 'APPROVED' });
  await test('Leave', 'Leave Balances', 'GET', `/leave/balances?employeeId=${validEmpId}`);

  // 4. Payroll
  await client.query(`UPDATE "Employee" SET is_active = true WHERE company_id = $1`, [admin.company_id]);
  
  // Assign dummy salary
  await client.query(`
    INSERT INTO "SalaryStructure" (id, company_id, name)
    VALUES (gen_random_uuid(), $1, 'UAT')
    ON CONFLICT DO NOTHING
  `, [admin.company_id]);
  const structRes = await client.query(`SELECT id FROM "SalaryStructure" WHERE company_id = $1 LIMIT 1`, [admin.company_id]);
  if (structRes.rows.length > 0) {
    await client.query(`
      INSERT INTO "EmployeeSalary" (id, employee_id, salary_structure_id, effective_from, ctc_annual, ctc_monthly)
      VALUES (gen_random_uuid(), $1, $2, NOW(), 1200000, 100000)
      ON CONFLICT DO NOTHING
    `, [validEmpId, structRes.rows[0].id]);
  }
  
  const runData = { month: 6, year: 2026 };
  const payrollRunRes = await test('Payroll', 'Run Payroll', 'POST', '/payroll/run', runData);
  let runId = null;
  if (payrollRunRes.status === 201) {
    runId = JSON.parse(payrollRunRes.data).id;
  } else {
    const runsRes = await req('GET', '/payroll/runs');
    if (runsRes.status === 200 && JSON.parse(runsRes.data).length > 0) runId = JSON.parse(runsRes.data)[0].id;
  }
  if (runId) {
    const payslipsRes = await test('Payroll', 'Generate Payslips', 'GET', `/payroll/runs/${runId}/payslips`);
    let targetEmpId = validEmpId;
    if (payslipsRes && payslipsRes.status === 200) {
      const payslips = JSON.parse(payslipsRes.data);
      console.log("Found payslips:", payslips.length);
      if (payslips.length > 0) targetEmpId = payslips[0].employee_id;
    }
    await test('Payroll', 'Download Payslips', 'GET', `/payroll/${runId}/payslip/${targetEmpId}`);
  }
  await test('Payroll', 'Payroll History', 'GET', '/payroll/runs');

  // 5. Documents
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const multipartBody = `--${boundary}\r\nContent-Disposition: form-data; name="employee_id"\r\n\r\n${validEmpId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\nID_PROOF\r\n--${boundary}\r\nContent-Disposition: form-data; name="document_name"\r\n\r\nTestDoc\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\nFake PDF Content\r\n--${boundary}--\r\n`;
  const docRes = await test('Documents', 'Upload Document', 'POST', '/documents', multipartBody, { 'Authorization': `Bearer ${token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` });
  let docId = 'dummy-id';
  if (docRes.status === 200 || docRes.status === 201) docId = JSON.parse(docRes.data).id;
  await test('Documents', 'Download Document', 'GET', `/documents/${docId}/download`);
  await test('Documents', 'Delete Document', 'DELETE', `/documents/${docId}`); 

  // 6. Announcements
  const annData = { title: 'UAT Test', content: 'Testing', priority: 'IMPORTANT', expiryDate: '2026-12-31' };
  const annRes = await test('Announcements', 'Create Announcement', 'POST', '/announcements', annData);
  let annId = null;
  if (annRes.status === 201) annId = JSON.parse(annRes.data).id;
  if (annId) {
    await test('Announcements', 'Edit Announcement', 'PUT', `/announcements/${annId}`, { title: 'Updated' });
    await test('Announcements', 'View Announcements', 'GET', '/announcements');
  }

  // 7. Loans
  const loanData = { employeeId: validEmpId, loanType: 'PERSONAL', principalAmount: 5000, interestRate: 5, tenureMonths: 12, startDate: '2026-07-01' };
  const loanApplyRes = await test('Loans', 'Apply Loan', 'POST', '/loans/apply', loanData);
  let loanId = null;
  if (loanApplyRes.status === 201) loanId = JSON.parse(loanApplyRes.data).id;
  if (loanId) await test('Loans', 'Approve Loan', 'PUT', `/loans/${loanId}/approve`, { status: 'APPROVED' });

  // 8. Reports
  await test('Reports', 'Excel Export', 'GET', '/analytics/export');
  await test('Reports', 'PDF Export', 'GET', '/analytics/export/pdf?type=payroll');

  await client.end();
}

runAudit();
