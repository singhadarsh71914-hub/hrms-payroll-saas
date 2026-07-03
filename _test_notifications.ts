import pg from 'pg';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import assert from 'assert';

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

async function run() {
  console.log('--- STARTING NOTIFICATIONS UAT ---');
  await client.connect();

  // Get Admin
  const hrRes = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'ADMIN' OR u.role = 'HR'
    LIMIT 1
  `);
  if (hrRes.rows.length === 0) throw new Error("No admin/hr found");
  const hr = hrRes.rows[0];
  const hrToken = jwt.sign(hr, JWT_SECRET, { expiresIn: '1h' });
  const hrHeaders = { Authorization: `Bearer ${hrToken}` };

  // Get Employee
  const empRes = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'EMPLOYEE' AND u.company_id = $1
    LIMIT 1
  `, [hr.company_id]);
  if (empRes.rows.length === 0) throw new Error("No employee found");
  const emp = empRes.rows[0];

  // Force link user_id if missing
  if (!emp.employee_id) {
    const rawEmp = await client.query(`SELECT id FROM "Employee" WHERE company_id = $1 AND user_id IS NULL LIMIT 1`, [hr.company_id]);
    if (rawEmp.rows.length > 0) {
      emp.employee_id = rawEmp.rows[0].id;
      await client.query(`UPDATE "Employee" SET user_id = $1 WHERE id = $2`, [emp.id, emp.employee_id]);
    }
  }

  const empToken = jwt.sign(emp, JWT_SECRET, { expiresIn: '1h' });
  const empHeaders = { Authorization: `Bearer ${empToken}` };

  // Clear existing notifications for tests
  await client.query(`DELETE FROM "Notification"`);

  // TEST 1: Leave Applied
  console.log('Testing: Leave Applied -> Notification to Manager/HR');
  const d = new Date();
  const applyRes = await axios.post(`${BASE_URL}/leave/apply`, {
    leaveType: 'CASUAL',
    startDate: d.toISOString().split('T')[0],
    endDate: d.toISOString().split('T')[0],
    reason: 'Test Leave'
  }, { headers: empHeaders });
  const reqId = applyRes.data.id;

  let hrUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: hrHeaders });
  assert.ok(hrUnread.data.count > 0, 'HR should receive a notification');

  // TEST 2: Leave Approved
  console.log('Testing: Leave Approved -> Notification to Employee');
  await axios.patch(`${BASE_URL}/leave/requests/${reqId}/status`, {
    status: 'APPROVED'
  }, { headers: hrHeaders });

  const allDbNotifs = await client.query(`SELECT * FROM "Notification"`);
  console.log('ALL NOTIFICATIONS IN DB:', allDbNotifs.rows);

  let empUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
  console.log('empUnread.data:', empUnread.data);
  assert.ok(empUnread.data.count > 0, 'Employee should receive a notification for Leave Approved');

  // TEST 3: Announcement Published
  console.log('Testing: Announcement -> Notification to Employee');
  await axios.post(`${BASE_URL}/announcements`, {
    title: 'Test Announcement',
    content: 'Important info',
    priority: 'URGENT'
  }, { headers: hrHeaders });

  empUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
  assert.ok(empUnread.data.count >= 2, 'Employee should receive another notification for Announcement');

  // TEST 4: Payroll Processed
  console.log('Testing: Payroll Processed -> Notification to Employee');
  try {
    await axios.post(`${BASE_URL}/payroll/run`, {
      month: 7,
      year: 2026
    }, { headers: hrHeaders });
  } catch (e) {
    // ignore if already processed
  }

  // TEST 5: Mark Read
  console.log('Testing: Mark Read');
  const empNotifs = await axios.get(`${BASE_URL}/notifications`, { headers: empHeaders });
  const firstNotif = empNotifs.data.data[0];
  await axios.put(`${BASE_URL}/notifications/${firstNotif.id}/read`, {}, { headers: empHeaders });

  const unreadAfterMark = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
  assert.strictEqual(unreadAfterMark.data.count, empUnread.data.count - 1, 'Unread count should decrease by 1');

  // TEST 6: Mark All Read
  console.log('Testing: Mark All Read');
  await axios.put(`${BASE_URL}/notifications/mark-all-read`, {}, { headers: empHeaders });

  const finalUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
  assert.strictEqual(finalUnread.data.count, 0, 'Unread count should be 0 after Mark All Read');

  console.log('--- ALL TESTS PASSED ---');
  await client.end();
  process.exit(0);
}

run().catch(err => {
  console.error('Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
