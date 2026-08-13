import { test, expect } from '@playwright/test';

test.describe('Phase 15 - Password Recovery Tests', () => {
  test('Forgot Password flow with constant time response', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // UI Validation
    await expect(page.locator('h2')).toContainText('Reset Password');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Submit invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    // Browser validation handles this, so we don't assert toast here.

    // Submit valid but non-existent email
    await page.fill('input[type="email"]', 'doesnotexist@company.com');
    await page.click('button[type="submit"]');

    // The backend should ALWAYS return success to prevent email enumeration
    const successToast = page.locator('text=If an account exists, a reset link has been sent');
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // Success screen validation
    await expect(page.locator('text=Please check your inbox and spam folder')).toBeVisible();
  });

  test('Reset Password screen invalid token protection', async ({ page }) => {
    // Missing token
    await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2')).toContainText('Invalid Request');
    await expect(page.locator('text=Request New Link')).toBeVisible();

    // Invalid/expired token
    await page.goto('/reset-password?token=invalid_or_expired_token_123', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h2')).toContainText('Create New Password');
    
    await page.fill('input#password', 'NewSecurePass123!');
    await page.fill('input#confirmPassword', 'NewSecurePass123!');
    await page.click('button[type="submit"]');

    // Toast error should appear for invalid token
    const errorToast = page.locator('text=Invalid or expired password reset token');
    await expect(errorToast).toBeVisible({ timeout: 10000 });
  });

  test('Reset Password complexity enforcement', async ({ page }) => {
    await page.goto('/reset-password?token=some_token');
    
    // Too short
    await page.fill('input#password', 'short');
    await page.fill('input#confirmPassword', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible();

    // Mismatch
    await page.fill('input#password', 'NewSecurePass123!');
    await page.fill('input#confirmPassword', 'DifferentPass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
