const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const http = require('http');

const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, include: { employeeProfile: true } });
  if (!admin) {
    console.log("No admin found!");
    return;
  }
  
  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role, company_id: admin.company_id, employee_id: admin.employeeProfile?.id },
    process.env.JWT_SECRET || 'super-secret-jwt-key',
    { expiresIn: '1h' }
  );

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function testRoute(method, path, body = null) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api${path}`,
        method: method,
        headers: headers
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  const tests = [
    { method: 'GET', path: '/leave/balances' },
    { method: 'GET', path: '/leave/requests' },
    { method: 'POST', path: '/leave/apply', body: { leaveType: 'CASUAL', startDate: '2026-06-20', endDate: '2026-06-21', reason: 'Test', employeeId: admin.employeeProfile?.id } },
    { method: 'GET', path: '/leaves' },
    { method: 'POST', path: '/leaves/apply', body: { leaveType: 'CASUAL', startDate: '2026-06-20', endDate: '2026-06-21', reason: 'Test' } }
  ];

  for (const t of tests) {
    const res = await testRoute(t.method, t.path, t.body);
    console.log(`\nREQUEST: ${t.method} /api${t.path}`);
    console.log(`STATUS: ${res.status}`);
    console.log(`RESPONSE: ${res.data.substring(0, 100)}`);
  }
}
run();
