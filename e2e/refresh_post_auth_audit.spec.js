import { test, expect } from '@playwright/test';

test('audit post-auth refresh crash', async ({ page }) => {
  const errors = [];
  const networkErrors = [];
  const logs = [];

  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
    else logs.push('LOG: ' + msg.text());
  });
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('/auth/me')) {
      networkErrors.push(`API_ERROR: ${resp.status()} ${resp.url()}`);
    }
  });

  // Login
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Test /attendance/intelligence
  console.log("=== NAVIGATING TO /attendance/intelligence ===");
  await page.goto('http://localhost:5182/attendance/intelligence');
  await page.waitForTimeout(2000);
  
  console.log("=== REFRESHING /attendance/intelligence ===");
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log("=== ERRORS ===", errors);
  console.log("=== NETWORK ERRORS ===", networkErrors);

  // Clear and test /analytics
  errors.length = 0; networkErrors.length = 0;
  
  console.log("=== NAVIGATING TO /analytics ===");
  await page.goto('http://localhost:5182/analytics');
  await page.waitForTimeout(2000);
  
  console.log("=== REFRESHING /analytics ===");
  await page.reload();
  await page.waitForTimeout(3000);

  console.log("=== ERRORS ===", errors);
  console.log("=== NETWORK ERRORS ===", networkErrors);
});
