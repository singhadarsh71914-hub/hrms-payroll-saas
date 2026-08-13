import { chromium } from 'playwright';

async function testViewport(width, height) {
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
    const kpiCards = Array.from(document.querySelectorAll('div')).filter(el => 
      el.innerText && el.innerText.includes('Total Employees') && el.innerText.includes('active workforce')
    );
    const kpiCard = kpiCards.reverse().find(el => {
      const st = window.getComputedStyle(el);
      return st.backdropFilter !== 'none' || st.backgroundColor.includes('rgba(17');
    }) || kpiCards[0];
    const gridContainer = kpiCard ? kpiCard.parentElement : null;
    
    // Find next section
    const nextSection = gridContainer ? gridContainer.nextElementSibling : null;
    
    // Measure coordinates
    const gridRect = gridContainer ? gridContainer.getBoundingClientRect() : null;
    const cardRect = kpiCard ? kpiCard.getBoundingClientRect() : null;
    const nextRect = nextSection ? nextSection.getBoundingClientRect() : null;
    
    // Check all KPI cards to see if they are in 1 row or stacked
    const allCards = gridContainer ? Array.from(gridContainer.children) : [];
    const cardRects = allCards.map(c => c.getBoundingClientRect());
    const uniqueY = new Set(cardRects.map(r => r.y)).size; // Number of rows
    const cardHeights = cardRects.map(r => r.height);
    
    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      gridHeight: gridRect ? gridRect.height : null,
      cardHeight: cardRect ? cardRect.height : null,
      cardHeights: cardHeights,
      numberOfRows: uniqueY,
      verticalGapToNextSection: nextRect && gridRect ? nextRect.top - gridRect.bottom : null
    };
  });

  console.log(JSON.stringify(dump));
  await browser.close();
}

(async () => {
  await testViewport(1920, 1080);
  await testViewport(1024, 768);
  await testViewport(375, 667);
})();
