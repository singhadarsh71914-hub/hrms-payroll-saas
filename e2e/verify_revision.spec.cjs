const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.use({ viewport: { width: 1400, height: 900 } });

test('verify salary revision success', async ({ page, request }) => {
  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForURL('http://localhost:5173/');
  
  // Go to employees list
  await page.goto('http://localhost:5173/employees');
  
  // Wait for network/loading
  await page.waitForLoadState('networkidle');
  
  // Click first salary revision button
  const revisionBtn = page.locator('button[title="Salary Revision"]').first();
  await revisionBtn.waitFor();
  await revisionBtn.click();
  
  // Wait for modal to appear
  const modal = page.locator('.premium-card').filter({ hasText: 'Salary Revision' });
  await modal.waitFor();
  
  // Fill the form
  await page.fill('input[type="number"]', '1100000');
  await page.fill('input[type="date"]', '2026-07-02');
  await page.fill('textarea', 'Annual performance review');
  
  // Submit the form and wait for response
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/salary/revise') && res.request().method() === 'POST'),
    page.click('button[type="submit"]')
  ]);

  const reqBody = response.request().postDataJSON();
  const resStatus = response.status();
  const resBody = await response.json().catch(() => null) || await response.text();

  console.log('=== VERIFICATION RESULTS ===');
  console.log('Route:', '/api/salary/revise');
  console.log('Request Payload:', JSON.stringify(reqBody, null, 2));
  console.log('Response Status:', resStatus);
  console.log('Response Body:', JSON.stringify(resBody, null, 2));

  // Take screenshot of the success state (history should have updated)
  await page.waitForTimeout(500); // Wait for toast and optimistic update
  
  const artifactsDir = `C:/Users/singh/.gemini/antigravity-cli/brain/4b005a0d-c79f-4110-9690-70ac035cd54f`;
  await page.screenshot({ path: `${artifactsDir}/salary_revision_success.png` });
  
  expect(resStatus).toBe(200);
});
