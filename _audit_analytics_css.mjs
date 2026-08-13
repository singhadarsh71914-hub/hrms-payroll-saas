import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  await page.goto('http://localhost:5173/analytics/executive-dashboard');
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    const el = document.querySelector('div.grid');
    if (!el) return { error: "No .grid found" };
    return {
      className: el.className,
      display: window.getComputedStyle(el).display,
      height: window.getComputedStyle(el).height
    };
  });

  console.log(JSON.stringify(dump, null, 2));
  
  await browser.close();
})();
