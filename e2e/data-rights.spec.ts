import { test, expect } from '@playwright/test';

test.describe('Phase 17 - User Data Rights', () => {

  test('Export workflow initiates file download', async ({ page, request }) => {
    // 1. User logs in
    await page.goto('/login');
    await page.fill('input#email', 'deletion@e2e.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('h1')).toContainText('Welcome back', { timeout: 10000 });

    // Since we don't have a UI hooked up for this yet in the prompt constraints, we'll verify the API directly using the session context
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await request.get('http://localhost:3000/api/account/export', {
      headers: {
        'Accept': 'application/zip',
        'Authorization': `Bearer ${token}`
      }
    });

    // The endpoint should respond with 200 OK and be a zip file
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/zip');
    expect(response.headers()['content-disposition']).toContain('attachment; filename="account_export_');
  });

  test('Account soft deletion workflow', async ({ request, page }) => {
    // 1. User logs in
    await page.goto('/login');
    await page.fill('input#email', 'deletion@e2e.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('h1')).toContainText('Welcome back', { timeout: 10000 });
    
    // 2. Fire API request for deletion with valid password
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const response = await request.post('http://localhost:3000/api/account/delete', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        password: 'password123'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toContain('Account scheduled for deletion');
    expect(body.message).toContain('30-day grace period');
    
    // Test invalid password rejection
    const failResponse = await request.post('http://localhost:3000/api/account/delete', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        password: 'wrong_password'
      }
    });
    
    expect(failResponse.status()).toBe(401);
  });

});

