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
    const ancestors = [];
    let current = document.querySelector('.main-content > div'); // The DashboardRoot
    if (!current) {
        current = Array.from(document.querySelectorAll('div')).find(el => 
            el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
        );
    }
    if (!current) return "No dashboard found";

    while (current && current.tagName !== 'BODY') {
      const st = window.getComputedStyle(current);
      ancestors.push({
        tag: current.tagName,
        className: current.className,
        display: st.display,
        height: st.height,
        scrollHeight: current.scrollHeight,
        clientHeight: current.clientHeight
      });
      current = current.parentElement;
    }
    
    return ancestors;
  });

  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
})();
