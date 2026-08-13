const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\singh\\.gemini\\antigravity-cli\\brain\\a60e72cc-e6ad-4e1f-ac74-5507cb980b4f\\scratch';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 425, height: 920 },
  { width: 375, height: 812 },
  { width: 320, height: 568 }
];

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  console.log("Waiting for dashboard...");
  await page.waitForTimeout(3000); // Give time for login & redirect & animation

  for (const vp of viewports) {
    console.log(`Processing viewport ${vp.width}x${vp.height}...`);
    await page.setViewportSize(vp);
    await page.waitForTimeout(1000); // give time for responsive adjustments

    const fullPath = path.join(outDir, `dashboard_${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: fullPath, fullPage: true });

    // Locate the upcoming events card
    // It is the 2nd child of the first dashboard-grid-2 (Row 2)
    const upcomingEventsLoc = page.locator('.dashboard-grid-2').first().locator('> div').nth(1);
    if (await upcomingEventsLoc.count() > 0) {
      const widgetPath = path.join(outDir, `upcoming_${vp.width}x${vp.height}.png`);
      await upcomingEventsLoc.screenshot({ path: widgetPath });
    }
  }

  console.log("Done");
  await browser.close();
})();
