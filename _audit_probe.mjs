/**
 * HRMS Production-Readiness API Probe
 * Tests every significant API endpoint with a real authenticated session.
 * Outputs structured results for each module.
 */
const BASE = 'http://localhost:3000';
const TEST_EMAIL = 'verify_test_admin@hrms.local';
const TEST_PASS = 'VerifyTest@123';

const results = [];

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });
  const d = await res.json();
  if (!res.ok || !d.accessToken) throw new Error(`Login failed: ${JSON.stringify(d)}`);
  return d.accessToken;
}

async function probe(label, method, url, token, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${url}`, opts);
    let data;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    results.push({ label, method, url, status: res.status, ok: res.ok, data });
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    results.push({ label, method, url, status: 'ERR', ok: false, data: e.message });
    return { status: 'ERR', ok: false, data: e.message };
  }
}

async function runAllProbes(token) {
  // ─────────────────────────────────────────
  // DASHBOARD / ANALYTICS
  // ─────────────────────────────────────────
  await probe('Dashboard: overview stats', 'GET', '/api/analytics/overview', token);
  await probe('Dashboard: headcount trend', 'GET', '/api/analytics/headcount-trend', token);
  await probe('Dashboard: payroll trend', 'GET', '/api/analytics/payroll-trend', token);
  await probe('Dashboard: leave analytics', 'GET', '/api/analytics/leave-analytics', token);
  await probe('Dashboard: department dist', 'GET', '/api/analytics/department-distribution', token);
  await probe('Dashboard: top earners', 'GET', '/api/analytics/top-earners', token);
  await probe('Dashboard: attendance rate', 'GET', '/api/analytics/attendance-rate', token);
  await probe('Dashboard: recent activity', 'GET', '/api/dashboard/recent-activity', token);

  // ─────────────────────────────────────────
  // EMPLOYEES
  // ─────────────────────────────────────────
  await probe('Employees: list', 'GET', '/api/employees', token);
  await probe('Employees: list paginated', 'GET', '/api/employees?page=1&limit=10', token);
  await probe('Employees: search', 'GET', '/api/employees?search=test', token);
  await probe('Employees: filter active', 'GET', '/api/employees?status=active', token);
  await probe('Employees: departments (org)', 'GET', '/api/org/departments', token);
  await probe('Employees: designations (org)', 'GET', '/api/org/designations', token);

  // ─────────────────────────────────────────
  // ATTENDANCE
  // ─────────────────────────────────────────
  await probe('Attendance: list', 'GET', '/api/attendance', token);
  await probe('Attendance: list with month', 'GET', '/api/attendance?month=2026-06', token);
  await probe('Attendance: clock-in', 'POST', '/api/attendance/clock-in', token, {});
  await probe('Attendance: clock-out', 'POST', '/api/attendance/clock-out', token, {});
  await probe('Attendance: summary', 'GET', '/api/attendance/summary', token);
  await probe('Attendance: export', 'GET', '/api/attendance/export?month=2026-06', token);

  // ─────────────────────────────────────────
  // LEAVE
  // ─────────────────────────────────────────
  await probe('Leave: list all', 'GET', '/api/leave', token);
  await probe('Leave: leave types', 'GET', '/api/leave/types', token);
  await probe('Leave: balances', 'GET', '/api/leave/balances', token);
  await probe('Leave: create request', 'POST', '/api/leave', token, {
    employee_id: 'non-existent', leave_type_id: 'non-existent',
    start_date: '2026-07-01', end_date: '2026-07-01', reason: 'Test'
  });
  await probe('Leave: approve (bogus id)', 'PUT', '/api/leave/bogus-id/approve', token, { status: 'APPROVED' });

  // ─────────────────────────────────────────
  // PERFORMANCE
  // ─────────────────────────────────────────
  await probe('Performance: list reviews', 'GET', '/api/performance', token);
  await probe('Performance: cycles', 'GET', '/api/performance/cycles', token);
  await probe('Performance: create cycle', 'POST', '/api/performance/cycles', token, {
    name: 'Test Cycle', period: 'Q1 2026', start_date: '2026-01-01', end_date: '2026-03-31'
  });
  await probe('Performance: analytics', 'GET', '/api/performance/analytics', token);

  // ─────────────────────────────────────────
  // PAYROLL
  // ─────────────────────────────────────────
  await probe('Payroll: list runs', 'GET', '/api/payroll', token);
  await probe('Payroll: list with month', 'GET', '/api/payroll?month=2026-06', token);
  await probe('Payroll: run payroll', 'POST', '/api/payroll/run', token, { month: '2026-06' });
  await probe('Payroll: salary structures', 'GET', '/api/salary/structures', token);
  await probe('Payroll: payslip download (bogus)', 'GET', '/api/payroll/bogus-id/payslip', token);
  await probe('Payroll: export', 'GET', '/api/payroll/export?month=2026-06', token);

  // ─────────────────────────────────────────
  // LOANS
  // ─────────────────────────────────────────
  await probe('Loans: list all', 'GET', '/api/loans', token);
  await probe('Loans: list paginated', 'GET', '/api/loans?page=1&limit=10', token);
  await probe('Loans: create (bogus emp)', 'POST', '/api/loans', token, {
    employee_id: '00000000-0000-0000-0000-000000000000',
    amount: 10000, tenure_months: 12, reason: 'Test'
  });
  await probe('Loans: approve (bogus)', 'PUT', '/api/loans/bogus-id/approve', token, {});

  // ─────────────────────────────────────────
  // REIMBURSEMENTS
  // ─────────────────────────────────────────
  await probe('Reimbursements: list', 'GET', '/api/reimbursements', token);
  await probe('Reimbursements: create', 'POST', '/api/reimbursements', token, {
    category: 'TRAVEL', amount: 500, description: 'Test', date: '2026-06-01'
  });
  await probe('Reimbursements: approve bogus', 'PUT', '/api/reimbursements/bogus/approve', token, {});

  // ─────────────────────────────────────────
  // DOCUMENTS
  // ─────────────────────────────────────────
  await probe('Documents: list', 'GET', '/api/documents', token);
  await probe('Documents: types', 'GET', '/api/documents/types', token);
  await probe('Documents: download bogus', 'GET', '/api/documents/bogus-id/download', token);

  // ─────────────────────────────────────────
  // TAX
  // ─────────────────────────────────────────
  await probe('Tax: declarations list', 'GET', '/api/tax/declarations', token);
  await probe('Tax: Form 16 list', 'GET', '/api/tax/form16', token);
  await probe('Tax: compute tax', 'POST', '/api/tax/compute', token, { financial_year: '2025-26' });
  await probe('Tax: generate Form16 bogus', 'GET', '/api/tax/form16/bogus-id/download', token);

  // ─────────────────────────────────────────
  // HOLIDAYS
  // ─────────────────────────────────────────
  await probe('Holidays: list', 'GET', '/api/holidays', token);
  await probe('Holidays: create', 'POST', '/api/holidays', token, {
    name: 'Test Holiday', date: '2026-08-15', type: 'NATIONAL'
  });
  await probe('Holidays: delete bogus', 'DELETE', '/api/holidays/bogus-id', token);
  await probe('Holidays: export', 'GET', '/api/holidays/export', token);

  // ─────────────────────────────────────────
  // ANNOUNCEMENTS
  // ─────────────────────────────────────────
  await probe('Announcements: list', 'GET', '/api/announcements', token);
  await probe('Announcements: create NORMAL', 'POST', '/api/announcements', token, {
    title: 'Audit Test', content: 'Content', priority: 'NORMAL'
  });

  // ─────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────
  await probe('Audit: list', 'GET', '/api/audit-logs', token);
  await probe('Audit: paginated', 'GET', '/api/audit-logs?page=1&limit=20', token);
  await probe('Audit: filter by action', 'GET', '/api/audit-logs?action=LOGIN_SUCCESS', token);
  await probe('Audit: export', 'GET', '/api/audit-logs/export', token);

  // ─────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────
  await probe('Search: global', 'GET', '/api/search?q=test', token);
}

async function printReport() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           HRMS API ENDPOINT PROBE RESULTS                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let pass = 0, fail = 0, warn = 0;
  const groups = {};

  for (const r of results) {
    const module = r.label.split(':')[0].trim();
    if (!groups[module]) groups[module] = [];
    groups[module].push(r);
  }

  for (const [module, items] of Object.entries(groups)) {
    console.log(`\n── ${module} ──`);
    for (const r of items) {
      let icon;
      // For create/delete with intentionally bad IDs, 400/404 is expected
      const isBogus = r.url.includes('bogus') || r.url.includes('non-existent') || r.url.includes('00000000-0000-0000');
      if (r.ok) {
        icon = '✅';
        pass++;
      } else if (isBogus && (r.status === 400 || r.status === 404 || r.status === 422)) {
        icon = '⚠️ '; // expected failure
        warn++;
      } else if (r.status === 404) {
        icon = '❌ MISSING';
        fail++;
      } else if (r.status === 400 || r.status === 422) {
        icon = '❌ VALIDATION';
        fail++;
      } else if (r.status === 401 || r.status === 403) {
        icon = '⚠️  AUTH';
        warn++;
      } else {
        icon = `❌ HTTP${r.status}`;
        fail++;
      }

      const dataPreview = typeof r.data === 'object'
        ? JSON.stringify(r.data).slice(0, 120)
        : String(r.data).slice(0, 120);

      console.log(`  ${icon}  [${r.method} ${r.url}] → ${r.status}  ${dataPreview}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(`TOTALS: ✅ ${pass} passed  ❌ ${fail} failed  ⚠️  ${warn} warnings/expected`);
  console.log('══════════════════════════════════════════════════════════════════\n');

  // Write raw JSON for analysis
  const fs = await import('node:fs/promises');
  await fs.writeFile('./_audit_raw.json', JSON.stringify(results, null, 2));
  console.log('Full results written to _audit_raw.json\n');
}

async function main() {
  console.log('Logging in...');
  const token = await login();
  console.log(`✅ Token obtained\n\nRunning ${65}+ endpoint probes...`);
  await runAllProbes(token);
  await printReport();
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
