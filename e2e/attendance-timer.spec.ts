import { test, expect } from '@playwright/test';
import prisma from '../src/lib/prisma.ts';

test.describe('Live Attendance Timer & Work Session Tracking', () => {
  test.beforeAll(async () => {
    await prisma.attendance.deleteMany();
    // Ensure the test user has face_enrolled_at set, otherwise Check In button won't appear
    await prisma.employee.updateMany({
      where: { work_email: 'emp@e2e.com' },
      data: { face_enrolled_at: new Date(), face_descriptor: [0.1, 0.2], biometric_enabled: true }
    });
  });

  test.afterAll(async () => {
    await prisma.attendance.deleteMany();
  });

  test('Timer operations and refresh resilience', async ({ page, context }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'emp@e2e.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });

    const checkInBtn = page.locator('button:has-text("Check In")');
    const checkOutBtn = page.locator('button:has-text("Check Out")');

    await checkInBtn.waitFor({ state: 'visible' });

    // Ensure it shows "PENDING"
    await expect(page.locator('text="PENDING"')).toBeVisible();

    // 1. Check-In starts timer
    await checkInBtn.click();
    await expect(page.locator('text=Face Verification required')).toBeVisible();
    
    const checkInResponsePromise = page.waitForResponse('**/api/attendance/check-in');
    const sessionResponsePromise = page.waitForResponse('**/api/attendance/current-session');
    
    await page.click('button:has-text("Start Verification")');
    await checkInResponsePromise;
    const sessionResponse = await sessionResponsePromise;
    console.log('Session response:', await sessionResponse.json());

    // Verify timer badge shows ACTIVE
    await expect(page.locator('text="ACTIVE"')).toBeVisible();

    // Timer format matching HH:MM:SS
    const timerRegex = /\d{2}:\d{2}:\d{2}/;
    await expect(page.locator('div', { hasText: timerRegex }).first()).toBeVisible();

    // 2. Refresh page preserves timer
    await page.reload();
    await page.waitForURL('/', { timeout: 15000 });
    
    // Check if timer still exists and is active
    await expect(page.locator('text="ACTIVE"')).toBeVisible();
    await expect(page.locator('div', { hasText: timerRegex }).first()).toBeVisible();

    // 4. Logged-out/login preserves timer
    await context.clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', 'emp@e2e.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
    
    // 5. Navigate to another route and back
    await page.goto('/attendance'); // e.g., Attendance page
    await page.waitForTimeout(1000);
    await page.goto('/'); // back to dashboard
    
    await expect(page.locator('text="ACTIVE"')).toBeVisible();

    // 3. Check-Out freezes timer
    await checkOutBtn.click();
    await expect(page.locator('text=Face Verification required')).toBeVisible();
    
    const checkOutResponsePromise = page.waitForResponse('**/api/attendance/check-out');
    const sessionOutResponsePromise = page.waitForResponse('**/api/attendance/current-session');
    
    await page.click('button:has-text("Start Verification")');
    const checkOutResponse = await checkOutResponsePromise;
    console.log('Check-Out API status:', checkOutResponse.status());
    console.log('Check-Out API text:', await checkOutResponse.text());
    
    const sessionOutResponse = await sessionOutResponsePromise;
    console.log('Session out response:', await sessionOutResponse.json());

    // Verify status changes to COMPLETED
    await expect(page.locator('text="CHECKED OUT"')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text="ACTIVE"')).not.toBeVisible();
  });
});
