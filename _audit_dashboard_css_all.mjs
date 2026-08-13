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
  await page.waitForTimeout(3000); // let animations settle
  
  const dump = await page.evaluate(() => {
    const grids = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display === 'grid';
    });
    
    return grids.map(el => {
      const styles = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        text: el.innerText ? el.innerText.substring(0, 50).replace(/\n/g, ' ') : '',
        height: styles.height,
        gridTemplateColumns: styles.gridTemplateColumns,
        gridTemplateRows: styles.gridTemplateRows,
        gridAutoRows: styles.gridAutoRows,
        alignItems: styles.alignItems,
        justifyItems: styles.justifyItems,
        childrenCount: el.children.length
      };
    });
  });

  console.log(JSON.stringify(dump, null, 2));
  
  await browser.close();
})();
