import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 1440, height: 900, name: 'Laptop L' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 1024, height: 768, name: 'Tablet' },
    { width: 768, height: 1024, name: 'Tablet Portrait' },
    { width: 425, height: 900, name: 'Mobile L' },
    { width: 375, height: 812, name: 'Mobile M' },
    { width: 320, height: 568, name: 'Mobile S' },
  ];

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500); // allow layout
    
    const header = page.locator('header.top-navbar');
    const headerBox = await header.boundingBox();
    console.log(`\n[${vp.name} - ${vp.width}x${vp.height}] Header dimensions:`, headerBox);
    
    // Header should be 64px tall everywhere
    if (headerBox && headerBox.height !== 64) {
      console.error(`❌ Header height is ${headerBox.height}px instead of 64px on ${vp.name}`);
    } else {
      console.log(`✅ Header height is 64px`);
    }

    const searchBox = await page.locator('.navbar-search-container input').boundingBox();
    console.log(`Search Box:`, searchBox ? `${searchBox.width}px x ${searchBox.height}px` : 'Not visible');
    if (searchBox && (searchBox.x + searchBox.width > vp.width)) {
      console.error(`❌ Search box overflows viewport on ${vp.name}`);
    }

    const rightNav = await page.locator('.navbar-right').boundingBox();
    console.log(`Right Nav:`, rightNav ? `${rightNav.width}px x ${rightNav.height}px` : 'Not visible');
    if (rightNav && (rightNav.x + rightNav.width > vp.width)) {
      console.error(`❌ Right nav overflows viewport on ${vp.name}`);
    }

    // Check for horizontal scroll
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (scrollWidth > clientWidth) {
      console.error(`❌ Horizontal scroll detected on ${vp.name}! clientWidth: ${clientWidth}, scrollWidth: ${scrollWidth}`);
    } else {
      console.log(`✅ No horizontal scroll`);
    }

    // Test profile dropdown
    await page.locator('[data-testid="profile-dropdown"]').click();
    await page.waitForTimeout(300); // Wait for animation
    const dropdown = page.locator('.dropdown-menu');
    const dropdownBox = await dropdown.boundingBox();
    if (dropdownBox && (dropdownBox.x < 0 || dropdownBox.x + dropdownBox.width > vp.width)) {
      console.error(`❌ Dropdown overflows viewport on ${vp.name}`);
    } else {
      console.log(`✅ Dropdown positioned correctly`);
    }
    // close
    await page.locator('[data-testid="profile-dropdown"]').click();
  }

  await browser.close();
  console.log('\nAudit Script Complete.');
})().catch(console.error);
