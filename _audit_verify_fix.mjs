import { chromium } from 'playwright';

async function verifyViewport(width, height) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('http://localhost:5173/', { timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const dump = await page.evaluate(() => {
    // 1. Find KPI Cards
    const kpiCards = Array.from(document.querySelectorAll('div')).filter(el => 
      el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
    );
    const kpiCard = kpiCards.reverse().find(el => {
      const st = window.getComputedStyle(el);
      return st.backdropFilter !== 'none' || st.backgroundColor.includes('rgba(17');
    }) || kpiCards[0];
    
    // 2. Find KPI Grid (parent of KPI Card)
    const kpiGrid = kpiCard ? kpiCard.parentElement : null;
    
    // 3. Find Dashboard Root (parent of KPI Grid)
    const dashboardRoot = kpiGrid ? kpiGrid.parentElement : null;
    
    // 4. Find Main Content Wrapper (.main-content)
    const mainContent = document.querySelector('.main-content');
    
    // 5. Gather all KPI card heights
    const allCards = kpiGrid ? Array.from(kpiGrid.children) : [];
    const cardHeights = allCards.map(c => parseFloat(window.getComputedStyle(c).height));
    
    const getMetrics = (el) => {
      if (!el) return null;
      return {
        height: parseFloat(window.getComputedStyle(el).height),
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight
      };
    };

    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      DashboardRoot: getMetrics(dashboardRoot),
      MainContentWrapper: getMetrics(mainContent),
      KPIGrid: getMetrics(kpiGrid),
      KPICards: cardHeights
    };
  });

  console.log(JSON.stringify(dump));
  await browser.close();
}

(async () => {
  await verifyViewport(1920, 1080);
  await verifyViewport(1024, 768);
  await verifyViewport(375, 667);
})();
