import { test, expect } from '@playwright/test';

test('audit data', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Intercept the analytics headcount call
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/analytics/headcount') && response.status() === 200
  );

  await page.goto('http://localhost:5182/analytics');
  
  const response = await responsePromise;
  const json = await response.json();
  
  console.log("=== HEADCOUNT TREND API RESPONSE ===");
  console.table(json);
  
  const values = json.map(d => d.count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  console.log("MIN:", min);
  console.log("MAX:", max);
  
  const isFlat = min === max;
  const yDomain = isFlat 
    ? [Math.max(min - 5, 0), max + 5] 
    : [Math.max(min - 2, 0), max + 2];
    
  console.log("Y DOMAIN:", yDomain);
});
