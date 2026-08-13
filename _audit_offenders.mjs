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
    const kpiCards = Array.from(document.querySelectorAll('div')).filter(el => 
      el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
    );
    const kpiCard = kpiCards.reverse().find(el => {
      const st = window.getComputedStyle(el);
      return st.backdropFilter !== 'none' || st.backgroundColor.includes('rgba(17');
    }) || kpiCards[0];

    let current = kpiCard;
    const offenders = [];
    while (current && current.tagName !== 'BODY') {
      const st = window.getComputedStyle(current);
      const h = parseFloat(st.height);
      const contentH = current.scrollHeight;
      
      // We look for height > scrollHeight by more than a few pixels
      if (h > contentH + 5) {
        offenders.push({
          tag: current.tagName,
          className: current.className,
          style: current.getAttribute('style'),
          h, contentH
        });
      }
      
      current = current.parentElement;
    }
    
    return offenders;
  });

  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
})();
