import 'dotenv/config';
import { chromium } from 'playwright';
import prisma from './src/lib/prisma.ts';
import jwt from 'jsonwebtoken';

async function verifyBrowser() {
  console.log('Starting Browser Validation...');

  // Get admin user for login
  const user = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, role: true, company_id: true, email: true }
  });
  if (!user) { console.error('No admin user found'); process.exit(1); }

  const token = jwt.sign(
    { id: user.id, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '1h' }
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Set the token in localStorage via an init script or direct page navigation
  const page = await context.newPage();
  const logs: string[] = [];
  const errors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || type === 'warning') {
      errors.push(`[${type.toUpperCase()}] ${text}`);
    } else {
      logs.push(`[${type}] ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`[PAGE_ERROR] ${error.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('/api/')) {
      failedRequests.push(`[${response.status()}] ${response.url()}`);
    }
  });

  // Navigate to login page first to set context
  await page.goto('http://localhost:5173/login');
  await page.evaluate((t) => {
    localStorage.setItem('accessToken', t);
    localStorage.setItem('user', JSON.stringify({ id: 'mock', email: 'mock@mock.com', role: 'ADMIN' }));
  }, token);

  console.log('Validating Dashboard...');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations/renders
  console.log('Current URL after dashboard goto:', page.url());
  await page.screenshot({ path: 'dashboard.png' });

  console.log('Validating Analytics...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  console.log('Current URL after analytics goto:', page.url());
  await page.screenshot({ path: 'analytics.png' });


  // Check if any charts failed to render
  const chartContainers = await page.$$('.recharts-wrapper');
  console.log(`Found ${chartContainers.length} chart containers rendered on Analytics.`);

  await browser.close();
  await prisma.$disconnect();

  console.log('\n--- Validation Results ---');
  if (errors.length > 0) {
    console.error('Console Errors/Warnings:');
    errors.forEach(e => console.error(e));
  } else {
    console.log('No Console Errors/Warnings.');
  }

  if (failedRequests.length > 0) {
    console.error('Failed Network Requests:');
    failedRequests.forEach(r => console.error(r));
  } else {
    console.log('No Failed Network Requests.');
  }

  if (errors.length === 0 && failedRequests.length === 0) {
    console.log('Browser Validation PASSED.');
  } else {
    console.log('Browser Validation FAILED.');
  }
}

verifyBrowser().catch(async (e) => {
  console.error('Test script crashed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
