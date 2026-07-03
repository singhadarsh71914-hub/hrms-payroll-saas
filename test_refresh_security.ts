import prisma from './src/lib/prisma.ts';
import bcrypt from 'bcryptjs';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testSecurity() {
  console.log('--- STARTING AUTH REFRESH SECURITY AUDIT ---');

  const email = `audit_${Date.now()}@example.com`;
  const password = 'password123';

  // 1. Setup
  const hashedPassword = await bcrypt.hash(password, 10);
  const company = await prisma.company.create({ data: { name: 'Audit Co' } });
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      company_id: company.id,
      role: 'ADMIN'
    }
  });

  try {
    // 2. Login Audit
    console.log('2. Auditing Login Response...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    
    if (loginRes.data.refreshToken) {
      throw new Error('SECURITY FLAW: refreshToken found in JSON response body during login');
    }
    
    const setCookie = loginRes.headers['set-cookie'];
    if (!setCookie || !setCookie.some(c => c.includes('refreshToken'))) {
      throw new Error('RELIABILITY ISSUE: refreshToken cookie missing in login response');
    }
    
    if (!setCookie.some(c => c.includes('HttpOnly'))) {
      throw new Error('SECURITY FLAW: refreshToken cookie is NOT HttpOnly');
    }
    console.log('   PASS: Login response is secure (No RT in body, RT in HttpOnly cookie)');

    const cookie = setCookie[0];

    // 3. Refresh Audit
    console.log('3. Auditing Refresh Response...');
    const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
      headers: { Cookie: cookie }
    });

    if (refreshRes.data.refreshToken) {
      throw new Error('SECURITY FLAW: refreshToken found in JSON response body during refresh');
    }

    const refreshSetCookie = refreshRes.headers['set-cookie'];
    if (!refreshSetCookie || !refreshSetCookie.some(c => c.includes('refreshToken') && c.includes('HttpOnly'))) {
      throw new Error('SECURITY FLAW: refresh response failed to rotate or set secure cookie');
    }
    console.log('   PASS: Refresh response is secure (No RT in body, rotated RT in HttpOnly cookie)');

    console.log('\n--- SECURITY AUDIT PASSED ---');

  } catch (error: any) {
    console.error('AUDIT FAILED:', error.message);
  } finally {
    await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.company.delete({ where: { id: company.id } });
    process.exit();
  }
}

testSecurity();
