import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    return all.filter(el => {
      const st = window.getComputedStyle(el);
      const h = parseFloat(st.height);
      const c = el.scrollHeight;
      return h > c + 1; // height is strictly larger than scrollHeight
    }).map(el => ({
      tag: el.tagName,
      className: el.className,
      id: el.id,
      h: parseFloat(window.getComputedStyle(el).height),
      c: el.scrollHeight
    }));
  });

  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
})();
