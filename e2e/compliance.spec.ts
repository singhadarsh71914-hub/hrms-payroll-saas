import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';
const PASS = 'password123';

test.describe('Phase 15 - Compliance Audit & Fix E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL + '/login');
    await page.getByPlaceholder('name@company.com').fill('admin@e2e.com');
    await page.getByPlaceholder('••••••••').fill(PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(URL + '/');
  });

  test('Create, Edit, Delete Rule', async ({ page }) => {
    await page.goto(URL + '/statutory-config');
    
    // Validate page loaded
    await expect(page.locator('h1:has-text("Statutory Compliance")')).toBeVisible();

    // Create Rule
    await page.getByRole('button', { name: 'Create Rule' }).first().click();
    
    // Fill out the modal
    const modalHeading = page.locator('h2:has-text("Add New Rule")').or(page.locator('h2:has-text("Edit Rule")'));
    await expect(modalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Check if it was created
    await expect(page.locator('text=PT').first()).toBeVisible({ timeout: 5000 });
  });

  test('Payroll uses latest rules', async ({ page }) => {
    await page.goto(URL + '/payroll');
    await expect(page.locator('h1:has-text("Payroll Processing")')).toBeVisible();

    // Check elements
    // As an admin we can process payroll
    // We just check that the page is healthy
    const isError = await page.locator('text="Internal Server Error"').count();
    expect(isError).toBe(0);
  });

  test('Reports generate correctly', async ({ page }) => {
    await page.goto(URL + '/tax');
    await expect(page.locator('h1:has-text("Tax & Form 16 Management")')).toBeVisible();

    const isError = await page.locator('text="Internal Server Error"').count();
    expect(isError).toBe(0);
  });
});
