import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/login');
  
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  } catch (e) {
    console.log("Wait for URL timed out");
  }
  
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    const getStyles = (el, props) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      const res = {};
      props.forEach(p => res[p] = styles[p]);
      res.tagName = el.tagName;
      res.className = el.className;
      return res;
    };
    
    // Explicitly query the grid container by className
    const gridContainer = document.querySelector('div.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    
    if (!gridContainer) return { error: "gridContainer not found" };

    const firstKpi = gridContainer.children[0];

    return {
      gridContainer: getStyles(gridContainer, [
        'display',
        'gridTemplateColumns',
        'gridTemplateRows',
        'gridAutoRows',
        'alignItems',
        'justifyItems',
        'height',
        'minHeight',
        'maxHeight'
      ]),
      firstKpi: getStyles(firstKpi, [
        'height',
        'minHeight',
        'flex',
        'display',
        'alignSelf'
      ])
    };
  });

  console.log(JSON.stringify(dump, null, 2));
  
  await browser.close();
})();
