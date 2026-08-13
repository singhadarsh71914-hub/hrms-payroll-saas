import 'dotenv/config';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.ts';

const API_URL = 'http://localhost:3000/api';

async function main() {
  // Get a real admin user
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, role: true, company_id: true, email: true }
  });
  if (!user) { console.log('No admin user found'); process.exit(1); }

  const token = jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );
  const headers = { Authorization: `Bearer ${token}` };

  const endpoints = [
    '/analytics/overview',
    '/analytics/headcount',
    '/analytics/attendance-stats',
    '/analytics/misc-widgets',
    '/analytics/payroll-trend',
    '/analytics/payroll-trends',
    '/analytics/top-employees',
    '/analytics/leave-stats',
    '/analytics/department-stats',
    '/analytics/loan-stats',
    '/analytics/tds-trend',
    '/analytics/leave-utilization',
    '/analytics/compliance-scorecard',
    '/analytics/kpis',
  ];

  console.log(`\nTesting ${endpoints.length} endpoints for company: ${user.company_id}\n`);
  let passed = 0; let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await axios.get(`${API_URL}${ep}`, { headers, timeout: 10000 });
      const body = res.data;
      const isMock = JSON.stringify(body).includes('"fake"') || JSON.stringify(body).includes('"hardcoded"');
      console.log(`  ✓ ${ep} → ${res.status} | type: ${Array.isArray(body) ? 'array['+body.length+']' : 'object'} | has_data: ${JSON.stringify(body) !== '{}' && JSON.stringify(body) !== '[]'}`);
      passed++;
    } catch(e: any) {
      console.log(`  ✗ ${ep} → ${e.response?.status || 'ERR'} | ${e.response?.data?.error || e.message}`);
      failed++;
    }
  }

  console.log(`\nResult: ${passed} PASSED, ${failed} FAILED\n`);
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
