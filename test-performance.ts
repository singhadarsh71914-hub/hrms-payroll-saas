import { chromium } from 'playwright';
import prisma from './src/lib/prisma.ts';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

(async () => {
  const emp = await prisma.employee.findFirst({ include: { user: true }});
  if (!emp) throw new Error('No employee found in DB');
  
  const token = jwt.sign(
    { id: emp.user?.id, role: 'HR', company_id: emp.company_id, employee_id: emp.id },
    process.env.JWT_SECRET || 'supersecret'
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  console.log('Starting Performance E2E test...');

  try {
    // 1. Bypass Login as HR
    console.log('1. Bypassing Login...');
    await page.goto('http://localhost:5174/login');
    await page.evaluate(({ empData, token }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify({ 
        id: empData.user?.id || 'mock', 
        email: empData.email, 
        role: 'HR', 
        company_id: empData.company_id, 
        employee_id: empData.id 
      }));
    }, { empData: emp, token });

    await page.goto('http://localhost:5174/performance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('Logged in successfully via JWT!');

    // 2. Create Goal
    console.log('2. Creating Goal...');
    await page.getByRole('button', { name: 'Goals' }).click();
    await page.waitForTimeout(500);
    await page.getByText('New Goal').click();
    
    await page.locator('select').selectOption({ index: 1 });
    await page.locator('input[placeholder="Title"]').fill('E2E Test Goal');
    await page.locator('input[type="date"]').nth(0).fill('2026-01-01');
    await page.locator('input[type="date"]').nth(1).fill('2026-12-31');
    await page.getByText('Save Goal').click();
    await page.waitForTimeout(1000);
    
    const goalExists = await page.getByText('E2E Test Goal').isVisible();
    if (!goalExists) throw new Error('Goal not found in table');
    console.log('Goal created successfully!');

    // 3. Create KPI
    console.log('3. Creating KPI...');
    await page.getByRole('button', { name: 'KPIs' }).click();
    await page.waitForTimeout(500);
    await page.getByText('New KPI').click();

    await page.locator('select').selectOption({ index: 1 });
    await page.locator('input[placeholder="Title"]').fill('E2E Test KPI');
    await page.locator('input[placeholder="Target"]').fill('100');
    await page.locator('input[placeholder="Weightage"]').fill('25');
    await page.getByText('Save KPI').click();
    await page.waitForTimeout(1000);

    const kpiExists = await page.getByText('E2E Test KPI').isVisible();
    if (!kpiExists) throw new Error('KPI not found in table');
    console.log('KPI created successfully!');

    // 4. Create Review Cycle
    console.log('4. Creating Review Cycle...');
    await page.getByRole('button', { name: 'Reviews' }).click();
    await page.waitForTimeout(500);
    await page.getByText('New Review').click();

    await page.locator('select').selectOption({ index: 1 });
    await page.locator('input[placeholder="Cycle Name (e.g. Q1 2026)"]').fill('E2E Cycle 2026');
    await page.locator('input[placeholder="Review Period"]').fill('Q1 2026');
    await page.getByText('Start Review').click();
    await page.waitForTimeout(1000);

    const reviewExists = await page.getByText('E2E Cycle 2026').isVisible();
    if (!reviewExists) throw new Error('Review Cycle not found in table');
    console.log('Review Cycle created successfully!');

    // 5. Workflow: Self Review
    console.log('5. Self Review Submit...');
    await page.getByText('Force Self Submit').first().click();
    await page.waitForTimeout(1000);
    const selfReviewState = await page.getByText('SELF_REVIEW_SUBMITTED').isVisible();
    if (!selfReviewState) throw new Error('Self Review Submit failed');
    console.log('Self review submitted successfully!');

    // 6. Workflow: Manager Review
    console.log('6. Manager Review Submit...');
    await page.getByText('Submit Manager Review').first().click();
    await page.waitForTimeout(1000);
    const mgrReviewState = await page.getByText('MANAGER_REVIEW_SUBMITTED').isVisible();
    if (!mgrReviewState) throw new Error('Manager Review Submit failed');
    console.log('Manager review submitted successfully!');

    // 7. Workflow: HR Approve
    console.log('7. HR Approval...');
    await page.getByText('HR Approve').first().click();
    await page.waitForTimeout(1000);
    const approveState = await page.getByText('HR_APPROVED').isVisible();
    if (!approveState) throw new Error('HR Approval failed');
    console.log('HR Approval submitted successfully!');

    console.log('ALL TESTS PASSED SUCCESSFULLY');

  } catch (error) {
    console.error('Test Failed:', error);
    await page.screenshot({ path: 'test-error.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
