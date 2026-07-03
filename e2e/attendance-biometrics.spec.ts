import { test, expect } from '@playwright/test';
import prisma from '../src/lib/prisma.ts';

test.describe('Biometric Attendance Flow', () => {
  let employeeId: string;

  test.beforeAll(async () => {
    // Reset any existing data for the test employee
    const emp = await prisma.user.findUnique({ where: { email: 'emp@e2e.com' } });
    if (emp) {
      await prisma.employee.update({
        where: { user_id: emp.id },
        data: { face_enrolled_at: null, face_descriptor: null, biometric_enabled: false }
      });
      const employee = await prisma.employee.findUnique({ where: { user_id: emp.id } });
      employeeId = employee!.id;
      
      // Delete today's attendance for the employee
      await prisma.attendance.deleteMany({
        where: { employee_id: employeeId }
      });
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Complete Face Enrollment and Attendance Flow', async ({ page }) => {
    // Login as employee
    await page.goto('/login');
    await page.fill('input[type="email"]', 'emp@e2e.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Dashboard should load
    await expect(page.locator('text=My Dashboard')).toBeVisible();

    // 1. Face Enrollment
    const enrollBtn = page.locator('text=Enroll Face ID');
    await expect(enrollBtn).toBeVisible();
    await enrollBtn.click();
    
    // Wait for models to load and camera to start (simulated in E2E since Playwright handles fake camera)
    // Actually we need to mock the webcam/getScreenshot or use Playwright's fake device options.
    // Assuming Playwright is configured with --use-fake-ui-for-media-stream and --use-fake-device-for-media-stream
    await expect(page.locator('text=Face ID Enrollment')).toBeVisible();
    await page.click('button:has-text("Capture & Enroll")');
    
    // Wait for the modal to close and the Enrollment button to disappear
    await expect(page.locator('text="Enroll Face ID to Check In"')).not.toBeVisible({ timeout: 15000 });

    // Verify DB update
    const updatedEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
    expect(updatedEmp?.face_enrolled_at).not.toBeNull();
    expect(updatedEmp?.face_descriptor).not.toBeNull();

    // 2. Check In
    const checkInBtn = page.locator('button:has-text("Check In")');
    await expect(checkInBtn).toBeVisible();
    await checkInBtn.click();
    
    await expect(page.locator('text=Face Verification required')).toBeVisible();
    const checkInResponsePromise = page.waitForResponse('**/api/attendance/check-in');
    await page.click('button:has-text("Start Verification")');
    
    const checkInResponse = await checkInResponsePromise;
    console.log('Check-in status:', checkInResponse.status());
    console.log('Check-in body:', await checkInResponse.text());
    
    // Check-in should complete
    await expect(page.locator('text=ACTIVE').first()).toBeVisible({ timeout: 15000 });
    
    // Verify DB record
    const attendance = await prisma.attendance.findFirst({
      where: { employee_id: employeeId },
      orderBy: { date: 'desc' }
    });
    expect(attendance).not.toBeNull();
    expect(attendance?.check_in).not.toBeNull();
    
    // 3. Refresh Page and Session Restore
    await page.reload();
    await expect(page.locator('text=ACTIVE').first()).toBeVisible();
    
    // 4. Check Out
    const checkOutBtn = page.locator('button:has-text("Check Out")');
    await expect(checkOutBtn).toBeVisible();
    await checkOutBtn.click();
    
    await expect(page.locator('text=Face Verification required')).toBeVisible();
    await page.click('button:has-text("Start Verification")');
    
    await expect(page.locator('text="CHECKED OUT"')).toBeVisible({ timeout: 15000 });
    
    // Verify DB update
    const finalAttendance = await prisma.attendance.findUnique({ where: { id: attendance!.id } });
    expect(finalAttendance?.check_out).not.toBeNull();
  });
});
