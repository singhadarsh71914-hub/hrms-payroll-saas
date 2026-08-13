import { test, expect, chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 1440, height: 900, name: 'Laptop L' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 1024, height: 768, name: 'Tablet' },
    { width: 768, height: 1024, name: 'Tablet Portrait' },
    { width: 425, height: 920, name: 'Mobile L' },
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
    await page.waitForTimeout(500); // allow layout updates
    
    console.log(`\n===========================================`);
    console.log(`[${vp.name} - ${vp.width}x${vp.height}] Dashboard Audit`);
    
    // 1. KPI Grid
    const kpiGrid = page.locator('.dashboard-grid-4').first();
    const kpis = await kpiGrid.locator('> div').all();
    const kpiBoxes = await Promise.all(kpis.map(k => k.boundingBox()));
    
    let kpiRows = 1;
    if (kpiBoxes.length > 1) {
      const firstY = kpiBoxes[0]?.y;
      kpiBoxes.forEach(b => {
        if (b && Math.abs(b.y - firstY) > 10) kpiRows++;
      });
    }

    if (vp.width >= 1440 && kpiRows > 1) {
      console.error(`❌ KPI Grid should be 1 row on Desktop! Found ${kpiRows} rows.`);
    } else if (vp.width >= 1024 && vp.width < 1440 && (kpiRows > 2 || kpiRows < 1)) {
      console.error(`❌ KPI Grid should be 1-2 rows on Laptop! Found ${kpiRows} rows.`);
    } else if (vp.width < 768 && kpiRows !== 4) {
      console.error(`❌ KPI Grid should be 4 rows (1 col) on Mobile! Found ${kpiRows} rows.`);
    } else {
      console.log(`✅ KPI Grid layout is correct (${kpiRows} rows).`);
    }

    // 2. Quick Actions
    const quickActionsGrid = page.locator('.quick-actions-grid');
    if (await quickActionsGrid.count() > 0) {
      const qaButtons = await quickActionsGrid.locator('button').all();
      const qaBoxes = await Promise.all(qaButtons.map(b => b.boundingBox()));
      
      let qaRows = 1;
      if (qaBoxes.length > 1) {
        const firstY = qaBoxes[0]?.y;
        qaBoxes.forEach(b => {
          if (b && Math.abs(b.y - firstY) > 10) qaRows++;
        });
      }

      if (vp.width >= 1024 && qaRows > 1) {
        console.error(`❌ Quick Actions should be 1 row (4 cols) on Desktop/Tablet! Found ${qaRows} rows.`);
      } else {
        console.log(`✅ Quick Actions layout is correct (${qaRows} rows).`);
      }
    }

    // 3. No excessive whitespace
    const dashboardContainer = await page.locator('main > div').first().boundingBox();
    console.log(`Dashboard Container Height: ${dashboardContainer?.height}px`);
  }

  await browser.close();
  console.log('\nAudit Script Complete.');
})().catch(console.error);
