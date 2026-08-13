import { chromium } from 'playwright';
import fs from 'fs';

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
    console.log("Wait for URL timed out. Current URL:", page.url());
  }
  
  await page.waitForTimeout(3000); // let animations settle
  
  await page.screenshot({ path: 'dashboard-investigate.png', fullPage: true });
  
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
    
    // Find KPI cards by content
    const kpiCards = Array.from(document.querySelectorAll('div')).filter(el => 
      el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
    );
    
    const kpiCard = kpiCards.reverse().find(el => {
      const st = window.getComputedStyle(el);
      return st.backdropFilter !== 'none' || st.backgroundColor.includes('rgba(17');
    }) || kpiCards[0];
    
    const gridContainer = kpiCard ? kpiCard.parentElement : null;
    
    // Check main layout containers
    const dashboardRoot = gridContainer ? gridContainer.parentElement : null;
    const mainContent = dashboardRoot ? dashboardRoot.parentElement : null;

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
        'maxHeight',
        'flex'
      ]),
      kpiCard: getStyles(kpiCard, [
        'height',
        'minHeight',
        'flex',
        'display',
        'alignSelf'
      ]),
      dashboardRoot: getStyles(dashboardRoot, ['display', 'height', 'flex', 'flexGrow', 'minHeight', 'maxHeight']),
      mainContent: getStyles(mainContent, ['display', 'height', 'flex', 'flexDirection'])
    };
  });

  console.log(JSON.stringify(dump, null, 2));
  
  await browser.close();
})();
