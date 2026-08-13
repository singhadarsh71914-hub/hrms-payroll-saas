import { test, expect } from '@playwright/test';

test('audit post-auth refresh crash 2', async ({ page }) => {
  const errors = [];
  const networkErrors = [];

  page.on('pageerror', err => errors.push('PAGE_ERROR: ' + err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('CONSOLE_ERROR: ' + msg.text());
  });
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('/auth/me')) {
      networkErrors.push(`API_ERROR: ${resp.status()} ${resp.url()}`);
    }
  });

  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const urls = ['/company-settings', '/audit-logs'];
  
  for (const url of urls) {
    errors.length = 0; networkErrors.length = 0;
    console.log(`=== NAVIGATING TO ${url} ===`);
    await page.goto(`http://localhost:5173${url}`);
    await page.waitForTimeout(2000);
    
    console.log(`=== REFRESHING ${url} ===`);
    await page.reload();
    await page.waitForTimeout(3000);
    
    console.log(`=== ERRORS FOR ${url} ===`, errors);
    console.log(`=== NETWORK ERRORS FOR ${url} ===`, networkErrors);
  }
});
