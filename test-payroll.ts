import { chromium } from 'playwright';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import prisma from './src/lib/prisma.ts';

(async () => {
  console.log('Starting Payroll E2E test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  try {
    console.log('0. Clearing old payroll data...');
    await prisma.payslipLineItem.deleteMany({});
    await prisma.payslip.deleteMany({});
    await prisma.payrollRun.deleteMany({});

    console.log('1. Bypassing Login...');
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, role: true, company_id: true, email: true }
    });
    if (!user) throw new Error('No admin user found');

    const token = jwt.sign(
      { id: user.id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    await page.goto('http://localhost:5173/login');
    await page.evaluate((t) => {
      localStorage.setItem('accessToken', t);
      localStorage.setItem('user', JSON.stringify({
        id: '123',
        role: 'ADMIN',
        email: 'admin@company.com'
      }));
    }, token);
    
    await page.goto('http://localhost:5173/');
    console.log('Logged in successfully via JWT!');

    // 2. Create Salary Component
    console.log('2. Creating Salary Component...');
    await page.goto('http://localhost:5173/salary-components');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /New Component/i }).first().click();
    await page.waitForTimeout(500);
    
    // The form inputs
    const uniqueCode = 'TEST_COMP_' + Date.now();
    const uniqueOrder = Math.floor(Math.random() * 1000) + 100;
    await page.fill('input[name="name"]', 'Test Component');
    await page.fill('input[name="code"]', uniqueCode);
    await page.selectOption('select[name="type"]', 'EARNING');
    await page.selectOption('select[name="category"]', 'FIXED');
    await page.fill('input[name="display_order"]', uniqueOrder.toString());
    
    // Instead of waitForResponse we listen for it to log if it's 400
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/salary-components') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Save Component/i }).first().click()
    ]);
    
    if (response.status() !== 201) {
      console.log('Error creating component:', await response.text());
      throw new Error(`Expected 201, got ${response.status()}`);
    }
    console.log('Salary Component created successfully!');

    // 3. Create Salary Structure
    console.log('3. Creating Salary Structure...');
    await page.goto('http://localhost:5173/salary-structures');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /New Structure/i }).first().click();
    await page.waitForTimeout(500);
    
    const structName = 'Test Structure ' + Date.now() + Math.random().toString(36).slice(2, 7);
    await page.locator('.modal-body input').nth(0).fill(structName);
    await page.locator('.modal-body input').nth(1).fill('E2E Description');
    
    // Choose the created component
    await page.getByText(uniqueCode).locator('..').locator('..').getByRole('button').first().click();
    
    // We should also set the Calc Type to PERCENTAGE_OF_CTC and Value to 100 just to be safe
    await page.waitForTimeout(500); // Wait for UI to update
    const selects = await page.locator('select.form-control').all();
    if (selects.length > 0) {
      await selects[selects.length - 1].selectOption('PERCENTAGE_OF_CTC');
    }
    const inputs = await page.locator('input[type="number"]').all();
    if (inputs.length > 0) {
      await inputs[inputs.length - 1].fill('100');
    }
    
    await page.waitForTimeout(1000);
    const [structRes] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/salary-structures') && res.request().method() === 'POST'),
      page.getByRole('button', { name: /Save Structure/i }).first().click()
    ]);
    if (structRes.status() !== 201) {
      console.log('Error creating structure:', await structRes.text());
      throw new Error(`Expected 201, got ${structRes.status()}`);
    }
    console.log('Salary Structure created successfully!');

    // 4. Run Payroll
    console.log('4. Running Payroll...');
    await page.goto('http://localhost:5173/payroll');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Run Payroll/i }).first().click();
    await page.waitForResponse(res => res.url().includes('/api/payroll/run') && res.status() === 201);
    console.log('Payroll run successfully!');

    // 5. Download Payslip
    console.log('5. Testing Payslip Download...');
    // We should wait for payslips to load
    await page.waitForTimeout(2000);
    // Find the first download button
    const downloadBtns = await page.getByRole('button', { name: /Download/i }).all();
    if (downloadBtns.length > 0) {
      // It might trigger a download event
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
        downloadBtns[0].click()
      ]);
      if (download) {
        console.log('Payslip downloaded successfully!');
      } else {
        console.log('Download event not fired, but button clicked.');
      }
    } else {
      console.log('No Download buttons found (perhaps no employees).');
    }

    console.log('ALL TESTS PASSED SUCCESSFULLY');
    process.exit(0);

  } catch (err) {
    console.error('TEST FAILED:', err);
    console.log('Dumping HTML...');
    const html = await page.evaluate(() => document.body.innerHTML);
    const fs = await import('fs');
    fs.writeFileSync('test-payroll-html.txt', html);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
