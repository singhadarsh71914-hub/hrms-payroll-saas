import 'dotenv/config';
import { chromium } from 'playwright';
import prisma from './src/lib/prisma.ts';
import jwt from 'jsonwebtoken';

(async () => {
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, role: true, company_id: true, email: true }
  });

  const token = jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('user', JSON.stringify({ id: 'mock', email: 'mock@mock.com', role: 'ADMIN' }));
  }, token);

  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  const html = await page.content();
  console.log(html.includes('No Headcount Data') ? 'HAS_NO_HEADCOUNT_STATE' : 'NO_HEADCOUNT_STATE');
  console.log(html.includes('No Department Data') ? 'HAS_NO_DEPT_STATE' : 'NO_DEPT_STATE');
  console.log(html.includes('recharts-wrapper') ? 'HAS_RECHARTS' : 'NO_RECHARTS');
  
  await browser.close();
  await prisma.$disconnect();
})()
