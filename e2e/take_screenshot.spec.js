import { test, expect } from '@playwright/test';

test('take analytics screenshot', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto('http://localhost:5173/analytics');
  await page.waitForTimeout(3000); // Wait for animations
  
  await page.screenshot({ path: 'C:\\Users\\singh\\.gemini\\antigravity-cli\\brain\\4b005a0d-c79f-4110-9690-70ac035cd54f\\fixed_headcount_layout.png', fullPage: true });
  console.log('Screenshot taken!');
});
