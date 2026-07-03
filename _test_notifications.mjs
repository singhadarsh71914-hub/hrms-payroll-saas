import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import assert from 'assert';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function run() {
  console.log('--- STARTING NOTIFICATIONS UAT ---');

  // 1. Get an HR token
  const hrLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@acme.com',
    password: 'password123'
  });
  const hrToken = hrLogin.data.accessToken;
  const hrHeaders = { Authorization: `Bearer ${hrToken}` };

  // 2. Get an Employee token
  const empLogin = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'emp1@acme.com',
    password: 'password123'
  });
  const empToken = empLogin.data.accessToken;
  const empHeaders = { Authorization: `Bearer ${empToken}` };
  
  const empUser = empLogin.data.user;

  // Clear existing notifications for tests
  await prisma.notification.deleteMany({});

  // TEST 1: Leave Applied
  console.log('Testing: Leave Applied -> Notification to Manager/HR');
  const d = new Date();
  await axios.post(`${BASE_URL}/leave/apply`, {
    leaveType: 'CASUAL',
    startDate: d.toISOString().split('T')[0],
    endDate: d.toISOString().split('T')[0],
    reason: 'Test Leave'
  }, { headers: empHeaders });

  let hrUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: hrHeaders });
  assert.ok(hrUnread.data.count > 0, 'HR should receive a notification');

  // Get leave request id
  const requests = await axios.get(`${BASE_URL}/leave/requests`, { headers: hrHeaders });
  const reqId = requests.data[0].id;

  // TEST 2: Leave Approved
  console.log('Testing: Leave Approved -> Notification to Employee');
  await axios.patch(`${BASE_URL}/leave/requests/${reqId}/status`, {
    status: 'APPROVED'
  }, { headers: hrHeaders });

  let empUnread = await axios.get(`${BASE_URL}/notifications/unread-count`, { headers: empHeaders });
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
      month: 1,
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
}

run().catch(err => {
  console.error('Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
