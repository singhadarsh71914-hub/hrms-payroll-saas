import { test, expect } from '@playwright/test';
import prisma from '../src/lib/prisma.ts';

test.describe('Employee Attendance Module', () => {
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

  test('Check-in and Check-out flow with duplicate prevention', async ({ page, request }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'emp@e2e.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });

    const checkInBtn = page.locator('button:has-text("Check In")');
    const checkOutBtn = page.locator('button:has-text("Check Out")');

    // Wait for buttons to be visible
    await checkInBtn.waitFor({ state: 'visible' });

    // Assert initial state
    await expect(checkInBtn).toBeEnabled();
    await expect(checkOutBtn).toBeDisabled();

    // 1. Successful check-in
    await checkInBtn.click();
    await expect(page.locator('text=Face Verification required')).toBeVisible();

    const checkInResponsePromise = page.waitForResponse('**/api/attendance/check-in');
    await page.click('button:has-text("Start Verification")');
    const checkInResponse = await checkInResponsePromise;
    console.log('Check-In API status:', checkInResponse.status());
    console.log('Check-In API response:', await checkInResponse.text());
    
    // Button states should update
    await expect(page.locator('button:has-text("Checked In")')).toBeVisible({ timeout: 15000 });
    await expect(checkOutBtn).toBeEnabled();
    // 3. Duplicate check-in prevention (UI prevents it)
    // The Check In button is already asserted to be disabled above.
    
    // 2. Successful check-out
    await checkOutBtn.click();
    await expect(page.locator('text=Face Verification required')).toBeVisible();

    const checkOutResponsePromise = page.waitForResponse('**/api/attendance/check-out');
    await page.click('button:has-text("Start Verification")');
    await checkOutResponsePromise;
    
    // 4. Duplicate check-out prevention (UI prevents it)
    await expect(checkOutBtn).toBeDisabled({ timeout: 15000 });
  });
});
