// HRMS End-to-End Verification Script
// Login returns `accessToken` (not `token`)
const BASE = 'http://localhost:3000';

const TEST_EMAIL = 'verify_test_admin@hrms.local';
const TEST_PASS = 'VerifyTest@123';

async function ensureUser() {
  // Try register (creates user)
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS, role: 'ADMIN', company_name: 'Verify Corp' }),
  });
  const regData = await regRes.json();
  if (regRes.ok) {
    console.log(`✅ Test user registered (userId=${regData.userId})`);
  } else if (regData.message && regData.message.includes('already exists')) {
    console.log('  (test user already exists)');
  } else {
    console.log(`  Register: HTTP ${regRes.status} — ${JSON.stringify(regData)}`);
  }
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const data = await res.json();
  if (res.ok && data.accessToken) {
    console.log(`✅ Login OK — got accessToken`);
    return data.accessToken;
  }
  console.log(`❌ Login failed: HTTP ${res.status} — ${JSON.stringify(data)}`);
  return null;
}

async function testAnnouncements(token) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  ISSUE 1 — Announcement Creation                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  console.log('\nFile:  src/schemas/announcement.schema.ts');
  console.log('State: ALREADY FIXED (enum changed LOW/NORMAL/HIGH → NORMAL/IMPORTANT/URGENT)');
  console.log('       in git commit 68e0336 ("Fix all module bugs")');
  console.log('\nLine 7:  priority: z.enum([\'NORMAL\', \'IMPORTANT\', \'URGENT\']).optional()');
  console.log('Line 18: priority: z.enum([\'NORMAL\', \'IMPORTANT\', \'URGENT\']).optional()');

  const authHdr = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // Exact payload from the issue brief
  console.log('\n[Test A] POST /api/announcements — exact payload from issue:');
  const payload = { title: 'Test', content: 'Test', priority: 'IMPORTANT' };
  console.log('  Request:', JSON.stringify(payload));
  const res = await fetch(`${BASE}/api/announcements`, {
    method: 'POST', headers: authHdr, body: JSON.stringify(payload),
  });
  const data = await res.json();
  console.log(`  HTTP ${res.status}`);
  console.log('  Response:', JSON.stringify(data, null, 4));

  if (res.ok) {
    console.log('  ✅ PASS — priority=IMPORTANT accepted, announcement created');
    if (data.id) {
      const del = await fetch(`${BASE}/api/announcements/${data.id}`, {
        method: 'DELETE', headers: authHdr });
      console.log(`  (Cleanup: DELETE ${data.id} → HTTP ${del.status})`);
    }
  } else {
    console.log('  ❌ FAIL');
  }

  console.log('\n[Test B] All valid priority values:');
  for (const p of ['NORMAL', 'IMPORTANT', 'URGENT']) {
    const r = await fetch(`${BASE}/api/announcements`, {
      method: 'POST', headers: authHdr,
      body: JSON.stringify({ title: 'T', content: 'c', priority: p }),
    });
    const d = await r.json();
    const icon = r.ok ? '✅' : '❌';
    console.log(`  ${icon} priority=${p} → HTTP ${r.status}${r.ok ? '' : ' — ' + JSON.stringify(d)}`);
    if (r.ok && d.id) {
      await fetch(`${BASE}/api/announcements/${d.id}`, { method: 'DELETE', headers: authHdr });
    }
  }

  console.log('\n[Test C] Old/invalid values — must reject with 400:');
  for (const p of ['LOW', 'HIGH']) {
    const r = await fetch(`${BASE}/api/announcements`, {
      method: 'POST', headers: authHdr,
      body: JSON.stringify({ title: 'bad', content: 'bad', priority: p }),
    });
    const d = await r.json();
    const expected400 = r.status === 400;
    console.log(`  ${expected400 ? '✅' : '❌'} priority=${p} → HTTP ${r.status} (expected 400) — ${JSON.stringify(d)}`);
  }
}

async function auditNotifications(token) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  ISSUE 2 — Notifications / Mark All Read            ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const authHdr = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('\n[Audit] Live endpoint probe:');
  const probes = [
    { method: 'GET',   url: '/api/notifications' },
    { method: 'PUT',   url: '/api/notifications/mark-all-read' },
    { method: 'PATCH', url: '/api/notifications/mark-all-read' },
  ];
  for (const p of probes) {
    const r = await fetch(`${BASE}${p.url}`, { method: p.method, headers: authHdr });
    console.log(`  ${r.status === 404 ? '❌' : '⚠️ '} ${p.method} ${p.url} → HTTP ${r.status}`);
  }

  console.log('\n[Audit] Codebase investigation results:');
  const checks = [
    ['Prisma model "Notification"',              false, 'Not in schema.prisma — no DB table'],
    ['API route /api/notifications',             false, 'Not registered in src/index.ts'],
    ['Backend route file notifications.ts',      false, 'No file in src/routes/'],
    ['Backend service notificationService',      false, 'No file in src/services/'],
    ['Frontend service notification.service.ts', false, 'No file in client/src/services/'],
    ['Frontend state (unreadCount)',             false, 'No state in Layout.tsx or any component'],
    ['Layout.tsx "Mark all read" onClick',       false, '"Mark all read" is a plain <span> with NO onClick'],
    ['Bell icon unread badge',                   'partial', 'Red dot hardcoded — always shows, not data-driven'],
    ['Notification items in dropdown',           'partial', 'Two hardcoded static strings — not from API'],
  ];

  for (const [label, exists, note] of checks) {
    const icon = exists === true ? '✅' : exists === 'partial' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${label}`);
    console.log(`      └─ ${note}`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║    HRMS End-to-End Issue Verification Report        ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  await ensureUser();
  const token = await login();
  if (!token) { console.error('\n❌ Cannot obtain token. Stopping.'); process.exit(1); }

  await testAnnouncements(token);
  await auditNotifications(token);

  console.log('\n════════════════════════════════════════════════════');
  console.log('Verification complete. See final report below.');
}

main().catch(e => { console.error(e); process.exit(1); });
