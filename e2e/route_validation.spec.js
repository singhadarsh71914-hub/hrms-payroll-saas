import { test, expect } from '@playwright/test';

test('validate registered routes', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', exception => {
    errors.push(exception.toString());
  });

  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const routes = [
    '/attendance/intelligence',
    '/audit-logs',
    '/company-settings'
  ];

  const results = {};

  for (const route of routes) {
    await page.goto(`http://localhost:5173${route}`);
    await page.waitForTimeout(2000); // allow time to render
    
    const h1s = await page.evaluate(() => {
      const isBlank = document.body.innerHTML.trim().length < 100;
      return { isBlank };
    });
    
    results[route] = {
      isBlank: h1s.isBlank
    };
  }

  console.log('\n\n=== ROUTE VALIDATION ===');
  console.log(JSON.stringify(results, null, 2));
  console.log('CONSOLE ERRORS:', errors);
  console.log('=== END ===\n\n');
});
