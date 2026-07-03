/**
 * Exact diagnosis of what browser EmployeeForm.tsx sees:
 * 1. Fires the exact same 3 calls Promise.all makes
 * 2. Checks for 429 rate limit
 * 3. Confirms orphaned test employee (work_email constraint source)
 */
import 'dotenv/config';
import pg from 'pg';
import axios from 'axios';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const BASE = 'http://localhost:3000/api';

async function diagnose() {
  // Login to get real token
  const lr = await axios.post(`${BASE}/auth/login`, {
    email: 'adarsh@123.com', password: 'Admin@123',
  });
  const token = lr.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  console.log('✅ Login OK');

  // Simulate EXACTLY what Promise.all fires in useEffect
  // (three concurrent requests)
  console.log('\n=== Simulating Promise.all([getDepartments, getDesignations, getEmployees]) ===');
  const results = await Promise.allSettled([
    axios.get(`${BASE}/org/departments`, { headers }),
    axios.get(`${BASE}/org/designations`, { headers }),
    axios.get(`${BASE}/employees`, { headers }),
  ]);

  const [deptResult, desigResult, empResult] = results;

  console.log('\n--- getDepartments() ---');
  if (deptResult.status === 'fulfilled') {
    console.log(`  HTTP ${deptResult.value.status} — ${deptResult.value.data.length} items`);
    deptResult.value.data.forEach(d => console.log(`    {id:"${d.id}", name:"${d.name}"}`));
  } else {
    console.log(`  REJECTED — ${deptResult.reason?.response?.status} ${JSON.stringify(deptResult.reason?.response?.data)}`);
    console.log(`  ❌ THIS CAUSES Promise.all to reject — setDepartments() NEVER called`);
  }

  console.log('\n--- getDesignations() ---');
  if (desigResult.status === 'fulfilled') {
    console.log(`  HTTP ${desigResult.value.status} — ${desigResult.value.data.length} items`);
    desigResult.value.data.forEach(d => console.log(`    {id:"${d.id}", name:"${d.name}"}`));
  } else {
    console.log(`  REJECTED — ${desigResult.reason?.response?.status} ${JSON.stringify(desigResult.reason?.response?.data)}`);
    console.log(`  ❌ THIS CAUSES Promise.all to reject — setDesignations() NEVER called`);
  }

  console.log('\n--- getEmployees() ---');
  if (empResult.status === 'fulfilled') {
    console.log(`  HTTP ${empResult.value.status} — ${empResult.value.data.length} items`);
  } else {
    console.log(`  REJECTED — ${empResult.reason?.response?.status} ${JSON.stringify(empResult.reason?.response?.data)}`);
    console.log(`  ❌ THIS CAUSES Promise.all to reject — ALL 3 setters NEVER called`);
  }

  // Check if any request was rate limited
  const anyRateLimited = results.some(r =>
    r.status === 'rejected' && r.reason?.response?.status === 429
  );
  const anyFailed = results.some(r => r.status === 'rejected');

  console.log('\n=== RATE LIMIT STATUS ===');
  console.log(`Any 429 responses: ${anyRateLimited ? '❌ YES — this is why dropdowns are empty' : '✅ NO'}`);
  console.log(`Any failures at all: ${anyFailed ? '❌ YES' : '✅ NO'}`);

  if (anyFailed) {
    console.log('\n=== ROOT CAUSE ===');
    console.log('Promise.all() in EmployeeForm.tsx:47 rejects when ANY call fails.');
    console.log('This means setDepartments(), setDesignations(), setEmployees() are NEVER called.');
    console.log('departments state stays [] → dropdown renders 0 options.');
    console.log('The catch block only does console.error → user sees no error, no options.');
  }

  // Check orphaned test employees causing work_email constraint
  console.log('\n=== ORPHANED TEST EMPLOYEES (work_email constraint source) ===');
  const orphans = await pool.query(
    `SELECT e.id, e.employee_code, e.work_email, e.company_id, u.id as user_id
     FROM "Employee" e
     LEFT JOIN "User" u ON u.email = e.work_email
     WHERE e.work_email LIKE '%probe%' OR e.work_email LIKE '%test%' OR e.work_email LIKE '%verify%'
     ORDER BY e.created_at`
  );
  if (orphans.rows.length > 0) {
    console.log(`Found ${orphans.rows.length} orphaned test employee(s):`);
    orphans.rows.forEach(r => console.log(' ', JSON.stringify(r)));
    console.log('\n→ These cause "Unique constraint failed on work_email" if real user');
    console.log('  picks same email, OR if /api/employees fails (429) and the UI shows');
    console.log('  old constraint error.');
  } else {
    console.log('No orphaned test employees found.');
  }

  await pool.end();
}

diagnose().catch(e => { console.error('FATAL:', e.message); pool.end(); });
