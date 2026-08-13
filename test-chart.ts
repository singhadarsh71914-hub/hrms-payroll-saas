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
  await page.waitForTimeout(3000);
  
  const chartContainers = await page.$$('.recharts-wrapper');
  console.log(`Found ${chartContainers.length} chart containers.`);
  
  for (let i = 0; i < chartContainers.length; i++) {
    const box = await chartContainers[i].boundingBox();
    console.log(`Chart ${i} rect:`, box);
  }

  const headcountArea = await page.$('div[data-testid="headcount-card"] .recharts-wrapper');
  if (headcountArea) {
    console.log('Headcount area is visible!');
    const path = await headcountArea.$('path.recharts-area-area');
    console.log('Path exists:', !!path);
    if (!path) {
      const svg = await headcountArea.innerHTML();
      console.log('SVG HTML:', svg.substring(0, 500));
    }
  } else {
    console.log('Headcount area NOT visible!');
    const wrapperHTML = await page.$eval('div[data-testid="headcount-card"]', el => el.innerHTML);
    console.log('Card HTML:', wrapperHTML.substring(0, 300));
  }
  
  await browser.close();
  await prisma.$disconnect();
})()
