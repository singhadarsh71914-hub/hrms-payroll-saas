import { test, expect } from '@playwright/test';

test('audit refresh crash', async ({ page }) => {
  const errors = [];
  const networkErrors = [];
  const warnings = [];

  page.on('pageerror', err => {
    errors.push(err.stack || err.message || err);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
    if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && resp.url().includes('/api/')) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  // Login first to set up state
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  await page.goto('http://localhost:5182/analytics');
  await page.waitForTimeout(2000);

  // Now, we are logged in. Let's do a hard refresh.
  console.log("=== TRIGGERING HARD REFRESH ===");
  await page.reload();
  await page.waitForTimeout(3000);

  console.log("=== PAGE ERRORS ===");
  console.log(JSON.stringify(errors, null, 2));
  console.log("=== NETWORK ERRORS ===");
  console.log(JSON.stringify(networkErrors, null, 2));
  console.log("=== WARNINGS ===");
  console.log(JSON.stringify(warnings, null, 2));
});
