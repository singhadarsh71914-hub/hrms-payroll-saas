import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 2500 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    const kpiCards = Array.from(document.querySelectorAll('div')).filter(el => 
      el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
    );
    const kpiCard = kpiCards.reverse().find(el => {
      const st = window.getComputedStyle(el);
      return st.backdropFilter !== 'none' || st.backgroundColor.includes('rgba(17');
    }) || kpiCards[0];

    const ancestors = [];
    let current = kpiCard;
    while (current && current.tagName !== 'BODY') {
      const st = window.getComputedStyle(current);
      ancestors.push({
        tag: current.tagName,
        className: current.className,
        display: st.display,
        height: st.height,
        flex: st.flex,
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
