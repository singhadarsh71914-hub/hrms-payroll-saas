import pg from 'pg';
import jwt from 'jsonwebtoken';
import http from 'http';

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

  async function req(method, path, body = null) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: method,
        headers: headers
      };
      const request = http.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve({ status: response.statusCode, data }));
      });
      request.on('error', (err) => resolve({ status: 500, data: err.message }));
      if (body) request.write(JSON.stringify(body));
      request.end();
    });
  }

  const results = [];
  let score = 100;

  async function test(workflow, action, method, path, body = null) {
    const result = await req(method, path, body);
    const pass = result.status >= 200 && result.status < 400;
    
    if (!pass) score -= Math.floor(100 / 22);
    results.push({ workflow, action, status: result.status, pass, error: pass ? null : result.data.substring(0, 100) });
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
    password: 'password123',
    role: 'EMPLOYEE',
    employment_status: 'ACTIVE',
    date_of_joining: '2026-06-01'
  };
  const empRes = await test('Employee', 'Create Employee', 'POST', '/employees', createEmpData);
  let newEmpId = null;
  if (empRes.status === 201) {
    const data = JSON.parse(empRes.data);
    newEmpId = data.id;
  } else {
    const listRes = await req('GET', '/employees');
    if (listRes.status === 200) {
       const list = JSON.parse(listRes.data);
       if (list.length > 0) newEmpId = list[0].id;
    }
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
    if (listReqs.status === 200) {
      const list = JSON.parse(listReqs.data);
      if (list.length > 0) leaveReqId = list[0].id;
    }
  }
  if (leaveReqId) await test('Leave', 'Approve Leave', 'PATCH', `/leave/requests/${leaveReqId}/status`, { status: 'APPROVED' });
  await test('Leave', 'Leave Balances', 'GET', '/leave/balances');

  // 4. Payroll
  // Ensure we have active employees for payroll
  await client.query(`UPDATE "Employee" SET is_active = true WHERE company_id = $1`, [admin.company_id]);
  
  const runData = { month: 6, year: 2026 };
  const payrollRunRes = await test('Payroll', 'Run Payroll', 'POST', '/payroll/run', runData);
  let runId = null;
  if (payrollRunRes.status === 201) {
    runId = JSON.parse(payrollRunRes.data).id;
  } else {
    const runsRes = await req('GET', '/payroll/runs');
    if (runsRes.status === 200) {
       const runs = JSON.parse(runsRes.data);
       if (runs.length > 0) runId = runs[0].id;
    }
  }
  if (runId) {
    await test('Payroll', 'Generate Payslips', 'GET', `/payroll/runs/${runId}/payslips`);
    await test('Payroll', 'Download Payslips', 'GET', `/payroll/${runId}/payslip/${validEmpId}`);
  }
  await test('Payroll', 'Payroll History', 'GET', '/payroll/runs');

  // 5. Documents - use valid employeeId to prevent 500
  const docData = { employee_id: validEmpId, document_type: 'AADHAAR', document_name: 'Test Doc' };
  const docRes = await test('Documents', 'Upload Document', 'POST', '/documents', docData);
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
  await test('Reports', 'Excel Export', 'GET', '/analytics/export/excel?type=attendance');
  await test('Reports', 'PDF Export', 'GET', '/analytics/export/pdf?type=payroll');

  await client.end();
  console.log(`Total Score: ${Math.max(0, score)}/100`);
}

runAudit();
