import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  await page.goto('http://localhost:5173/admin/executive-dashboard'); // Wait, the route is /admin/executive-dashboard ? Let me just go there. Wait, I will search for the path.
  
  // Wait, let's just use the `Layout` to click on "Analytics"
  await page.click('text=Analytics');
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    // See if any element has tailwind computed properties
    const el = document.querySelector('.bg-slate-900');
    if (!el) return { error: "No .bg-slate-900 found" };
    return {
      className: el.className,
      backgroundColor: window.getComputedStyle(el).backgroundColor
    };
  });

  console.log(JSON.stringify(dump, null, 2));
  
  await browser.close();
})();
