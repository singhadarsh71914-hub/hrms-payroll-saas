import pg from 'pg';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import assert from 'assert';

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

async function run() {
  console.log('--- ANNOUNCEMENT -> NOTIFICATION TRACE ---');
  await client.connect();

  // 1. Get HR Admin
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

  // 2. Get Employee
  const empRes = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'EMPLOYEE' AND u.company_id = $1
    LIMIT 1
  `, [hr.company_id]);
  if (empRes.rows.length === 0) throw new Error("No employee found");
  const emp = empRes.rows[0];
  const empToken = jwt.sign(emp, JWT_SECRET, { expiresIn: '1h' });
  const empHeaders = { Authorization: `Bearer ${empToken}` };

  // Clear existing notifications
  await client.query(`DELETE FROM "Notification"`);

  // 3. Create Announcement
  const testTitle = `Trace Test Announcement ${Date.now()}`;
  console.log('1. Creating Announcement via POST /api/announcements...');
  const annRes = await axios.post(`${BASE_URL}/announcements`, {
    title: testTitle,
    content: 'Tracing the notification workflow.',
    priority: 'URGENT'
  }, { headers: hrHeaders });
  
  console.log('API Response (Announcement):', annRes.data);

  // 4. Verify DB Insert
  console.log('\n2. Verifying DB Notification Insertion...');
  const dbNotifs = await client.query(`SELECT id, company_id, user_id, type, title, is_read FROM "Notification" WHERE type = 'ANNOUNCEMENT_PUBLISHED'`);
  console.log('DB Notification Records:', dbNotifs.rows);
  assert.ok(dbNotifs.rows.length > 0, 'No notification inserted in DB');

  // Find the specific notification for the employee
  const empNotif = dbNotifs.rows.find(n => n.user_id === emp.id);
  assert.ok(empNotif, 'Notification not generated for the specific employee user_id');
  assert.strictEqual(empNotif.company_id, emp.company_id, 'Company ID mismatch');
  console.log(`Verified user_id (${empNotif.user_id}) and company_id (${empNotif.company_id}) match employee.`);

  // 5. Verify Unread Count API
  console.log('\n3. Verifying GET /api/notifications/unread-count...');
  const unreadRes = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
  console.log('Unread Count Response:', unreadRes.data);
  assert.strictEqual(unreadRes.data.success, true);
  assert.ok(unreadRes.data.count > 0, 'Unread count should be > 0');

  // 6. Verify GET API
  console.log('\n4. Verifying GET /api/notifications API response shape...');
  const notifRes = await axios.get(`${BASE_URL}/notifications`, { headers: empHeaders });
  console.log('API Response Structure:', Object.keys(notifRes.data));
  console.log('First Notification Item Keys:', notifRes.data.data.length > 0 ? Object.keys(notifRes.data.data[0]) : 'None');
  
  assert.strictEqual(notifRes.data.success, true);
  assert.ok(Array.isArray(notifRes.data.data), 'Expected "data" property to be an array');
  
  const foundNotif = notifRes.data.data.find((n: any) => n.title === 'New Announcement' && n.message === testTitle);
  assert.ok(foundNotif, 'Created notification not found in API response');
  
  console.log('\n--- TRACE SUCCESSFUL ---');
  await client.end();
  process.exit(0);
}

run().catch(err => {
  console.error('\n--- TRACE FAILED ---');
  console.error(err.response?.data || err.message);
  process.exit(1);
});
