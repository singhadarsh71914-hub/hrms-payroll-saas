import { test, expect } from '@playwright/test';

const URL = 'http://localhost:5173';
const PASS = 'password123';

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
];

const pages = [
  '/', // Dashboard
  '/analytics',
  '/workforce-intelligence',
  '/employees',
  '/attendance',
  '/leave',
  '/payroll',
  '/salary-components',
  '/salary-structures',
  '/performance',
  '/statutory-config',
  '/documents',
  '/loans',
  '/company-settings',
];

test.describe('Phase 16 - Responsive Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(URL + '/login');
    await page.getByPlaceholder('name@company.com').fill('admin@e2e.com');
    await page.getByPlaceholder('••••••••').fill(PASS);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(URL + '/');
  });

  for (const vp of viewports) {
    test(`Viewport ${vp.width}x${vp.height} validation`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize(vp);

      for (const route of pages) {
        await page.goto(URL + route);
        await page.waitForTimeout(500); // let UI settle
        
        // 1. Check React errors
        const isError = await page.locator('text="Internal Server Error"').count();
        expect(isError).toBe(0);

        // 2. Check for Horizontal Scroll or Clipped content (indicates broken layout)
        const hasHorizontalOverflow = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
             const rect = el.getBoundingClientRect();
             // Ignore SVG elements and their children, they sometimes report weird bounds
             if (el.closest('svg')) continue;
             // Ignore table responsive wrappers and tables themselves
             if (el.closest('.table-responsive') || el.closest('.table-container') || el.closest('.overflow-x-auto') || el.closest('[style*="overflow-x: auto"]') || el.closest('table')) continue;
             if (rect.right > vw + 15) {
                return {
                  hasOverflow: true,
                  tag: el.tagName,
                  className: el.className,
                  html: el.outerHTML.substring(0, 200),
                  rectRight: rect.right,
                  vw: vw
                };
             }
          }
          return { hasOverflow: false };
        });

        if (hasHorizontalOverflow.hasOverflow) {
           throw new Error(`Horizontal overflow found on ${route} at ${vp.width}x${vp.height}.\nElement: ${hasHorizontalOverflow.tag}.${hasHorizontalOverflow.className}\nrect.right: ${hasHorizontalOverflow.rectRight}, vw: ${hasHorizontalOverflow.vw}\nHTML: ${hasHorizontalOverflow.html}`);
        }
      }
    });
  }
});
