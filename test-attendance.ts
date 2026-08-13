import { chromium } from 'playwright';

(async () => {
  console.log('Starting Attendance E2E test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  try {
    console.log('1. Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'attendance.test@company.com');
    await page.fill('input[type="password"]', 'Test@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
    console.log('Logged in successfully!');

    console.log('2. Navigating to Dashboard (Employee View)...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    console.log('3. Checking In...');
    try {
      const enrollBtn = page.getByText('Enroll Face ID to Check In').first();
      if (await enrollBtn.isVisible({ timeout: 2000 })) {
        console.log('Enrolling Face ID first...');
        await enrollBtn.click();
        await page.waitForTimeout(1000);
        await page.getByText('Capture & Enroll').first().click();
        await page.waitForResponse(res => res.url().includes('/attendance/enroll-face') && res.status() === 200);
        console.log('Face ID Enrolled! Waiting for dashboard reload...');
        await page.waitForTimeout(2000);
      }
    } catch(e) {}

    const checkInBtn = page.getByRole('button', { name: /Check In/i }).first();
    try {
      const btnText = await checkInBtn.textContent({ timeout: 5000 });
      if (btnText?.includes('Checked In')) {
         console.log('Already Checked In! Skipping check in step.');
      } else {
         await checkInBtn.click();
         await page.waitForTimeout(1000);
         await page.getByText('Start Verification').first().click();
         await page.waitForResponse(res => res.url().includes('/attendance/check-in') && res.status() === 200);
         console.log('Check In successful!');
      }
    } catch (e) {
      console.log('Could not find Check In button! Dumping HTML...');
      const html = await page.evaluate(() => document.body.innerHTML);
      const fs = await import('fs');
      fs.writeFileSync('test-html.txt', html);
      console.log('Saved HTML to test-html.txt');
      throw e;
    }

    console.log('4. Starting Break...');
    const startBreakBtn = page.getByText('Start Break').first();
    await startBreakBtn.click();
    await page.waitForResponse(res => res.url().includes('/attendance/break/start') && res.status() === 200);
    console.log('Break Started successfully!');

    // Wait 5 seconds to simulate break duration (at least some ms)
    await page.waitForTimeout(5000);

    console.log('5. Ending Break...');
    const endBreakBtn = page.getByText('End Break').first();
    await endBreakBtn.click();
    await page.waitForResponse(res => res.url().includes('/attendance/break/end') && res.status() === 200);
    console.log('Break Ended successfully!');

    console.log('6. Checking Out...');
    const checkOutBtn = page.getByRole('button', { name: /Check Out/i }).first();
    await checkOutBtn.click();
    await page.waitForTimeout(1000);
    const modalHtmlOut = await page.evaluate(() => document.querySelector('.premium-card')?.outerHTML || 'No modal');
    console.log('Modal HTML Out:', modalHtmlOut);
    await page.getByText('Start Verification').first().click();
    await page.waitForResponse(res => res.url().includes('/attendance/check-out') && res.status() === 200);
    console.log('Check Out successful!');

    console.log('ALL TESTS PASSED SUCCESSFULLY');
  } catch (error) {
    console.error('TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
