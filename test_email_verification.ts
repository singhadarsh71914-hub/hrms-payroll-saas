import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import crypto from 'crypto';

import prisma from './src/lib/prisma';
const API_URL = 'http://localhost:3000/api/auth';

async function testEmailVerification() {
  console.log('--- STARTING EMAIL VERIFICATION TEST ---');
  let passCount = 0;
  let failCount = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passCount++;
    } else {
      console.log(`[FAIL] ${msg}`);
      failCount++;
    }
  };

  try {
    // 1. Get an unverified user or create one
    let user = await prisma.user.findFirst({
      where: { email: 'test_verify@example.com' }
    });

    if (!user) {
      // Create user for testing
      const company = await prisma.company.findFirst();
      user = await prisma.user.create({
        data: {
          email: 'test_verify@example.com',
          password_hash: 'hash',
          role: 'EMPLOYEE',
          company_id: company?.id,
          email_verified: false
        }
      });
    } else {
      // reset state
      await prisma.user.update({
        where: { id: user.id },
        data: { email_verified: false, email_verification_token: null, email_verification_expires_at: null }
      });
      user.email_verified = false;
    }

    // 2. Validate POST /api/auth/resend-verification
    // We need an auth token to hit resend-verification because it uses authenticate middleware
    // Actually, creating a mock auth token
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });

    try {
      const res = await axios.post(`${API_URL}/resend-verification`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert(res.status === 200, 'POST /resend-verification successful');
    } catch (e: any) {
      console.log('Failed resend:', e.response?.data || e.message);
      assert(false, 'POST /resend-verification should succeed');
    }

    // 3. Ensure token was created
    const userAfterSend = await prisma.user.findUnique({ where: { id: user.id } });
    assert(!!userAfterSend?.email_verification_token, 'Verification token saved to DB');
    
    // We can't easily get the raw token because we hash it. Let's manually set a known token.
    const rawToken = 'my_test_token_123';
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verification_token: hashedToken,
        email_verification_expires_at: new Date(Date.now() + 100000)
      }
    });

    // 4. Test expired token
    const expiredRawToken = 'expired_token';
    const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verification_token: expiredHash,
        email_verification_expires_at: new Date(Date.now() - 10000) // expired
      }
    });

    try {
      const res = await axios.get(`${API_URL}/verify-email?token=${expiredRawToken}`, { maxRedirects: 0, validateStatus: () => true });
      assert(res.status === 302, 'Expired token returns redirect');
      assert(res.headers.location?.includes('status=error'), 'Expired token redirects with status=error');
    } catch(e: any) {
      console.log(e);
    }

    // Restore valid token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verification_token: hashedToken,
        email_verification_expires_at: new Date(Date.now() + 100000)
      }
    });

    // 5. Invalid tokens cannot verify accounts
    try {
      const res = await axios.get(`${API_URL}/verify-email?token=invalid_garbage`, { maxRedirects: 0, validateStatus: () => true });
      assert(res.status === 302, 'Invalid token returns redirect');
      assert(res.headers.location?.includes('status=error'), 'Invalid token redirects with status=error');
    } catch(e) {}

    // 6. Validate GET /api/auth/verify-email?token=...
    try {
      const res = await axios.get(`${API_URL}/verify-email?token=${rawToken}`, { maxRedirects: 0, validateStatus: () => true });
      assert(res.status === 302, 'Valid token returns redirect');
      assert(res.headers.location?.includes('status=success'), 'Valid token redirects with status=success');
    } catch(e) {}

    // 7. Ensure email_verified updates correctly
    const finalUser = await prisma.user.findUnique({ where: { id: user.id } });
    assert(finalUser?.email_verified === true, 'email_verified is true in DB');
    assert(finalUser?.email_verification_token === null, 'Token is cleared from DB');

    console.log(`\nResults: ${passCount} Passed, ${failCount} Failed.`);
    process.exit(failCount > 0 ? 1 : 0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testEmailVerification();
