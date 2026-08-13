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
  
  page.on('console', msg => {
    if (msg.text().includes('DEBUG:')) console.log(msg.text());
  });

  await page.goto('http://localhost:5173/login');
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('user', JSON.stringify({ id: 'mock', email: 'mock@mock.com', role: 'ADMIN' }));
  }, token);

  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  await browser.close();
  await prisma.$disconnect();
})()
