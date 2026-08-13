const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log("Navigating to localhost:5173...");
  await page.goto('http://localhost:5173/login');
  
  // Login
  await page.fill('input[type="email"]', 'admin@example.com'); // adjust if needed
  await page.fill('input[type="password"]', 'admin123'); // adjust if needed
  await page.click('button[type="submit"]');

  await page.waitForURL('**/');
  console.log("Logged in. Measuring Dashboard...");
  
  await page.waitForTimeout(2000); // Wait for animations

  const rows = await page.evaluate(() => {
    const kpiRow = document.querySelector('.dashboard-grid-4');
    const grid2Rows = document.querySelectorAll('.dashboard-grid-2');
    
    function measure(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        height: rect.height,
        children: Array.from(el.children).map(c => {
          const r = c.getBoundingClientRect();
          return { height: r.height, tag: c.tagName, className: c.className };
        })
      };
    }

    return {
      kpiRow: measure(kpiRow),
      row2: measure(grid2Rows[0]),
      row3: measure(grid2Rows[1]),
      row4: measure(grid2Rows[2]),
    };
  });

  console.log(JSON.stringify(rows, null, 2));

  await browser.close();
})();
