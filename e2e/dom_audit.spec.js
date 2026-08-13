import { test, expect } from '@playwright/test';

test('headcount dom audit', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Intercept the analytics headcount call
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/analytics/headcount') && response.status() === 200
  );

  await page.goto('http://localhost:5173/analytics');
  
  const response = await responsePromise;
  const json = await response.json();
  
  console.log("=== STEP 2: DATA AUDIT ===");
  console.table(json);
  
  await page.waitForTimeout(2000); // let recharts render
  
  console.log("=== STEP 1: DOM AUDIT ===");
  const audit = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="headcount-card"]');
    if (!card) return null;
    
    // We assume layout matches the code we've written
    const header = card.children[0]; // TRUE HEADER ROW
    const splitContent = card.children[1]; // CONTENT SPLIT
    const kpi = splitContent?.children[0];
    const chartRegion = splitContent?.children[1];
    const chartContainer = chartRegion?.querySelector('.recharts-wrapper')?.parentElement;
    const svg = chartContainer?.querySelector('svg');
    
    // Line bounding box
    const line = svg?.querySelector('path.recharts-area-area');
    let lineTop = 0;
    let lineBottom = 0;
    
    if (line) {
      const bbox = line.getBBox();
      lineTop = bbox.y;
      lineBottom = bbox.y + bbox.height;
    }
    
    return {
      cardHeight: card.getBoundingClientRect().height,
      headerHeight: header ? header.getBoundingClientRect().height : 0,
      kpiHeight: kpi ? kpi.getBoundingClientRect().height : 0,
      chartContainerHeight: chartContainer ? chartContainer.getBoundingClientRect().height : 0,
      svgHeight: svg ? svg.getBoundingClientRect().height : 0,
      lineTop: lineTop,
      lineBottom: lineBottom,
      lineUsagePercent: svg ? ((lineBottom - lineTop) / svg.getBoundingClientRect().height) * 100 : 0
    };
  });
  
  console.log(audit);
  
  console.log("=== STEP 3: RECHARTS AUDIT ===");
  const values = json.map(d => d.count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variation = max - min;
  
  let yDomain = [];
  let chartHeight = 200;
  
  const firstNonZero = values.findIndex(v => v > 0);
  const insufficientHistory = firstNonZero >= values.length - 2 && firstNonZero !== -1;
  const isFlat = json.length > 0 && variation === 0;
  
  if (insufficientHistory) {
    chartHeight = 100;
  } else if (variation <= 1) {
    chartHeight = 90;
  } else if (variation <= 3) {
    chartHeight = 120;
  } else {
    chartHeight = 200;
  }
  
  if (isFlat) {
    yDomain = [Math.max(min - 5, 0), max + 5];
  } else if (variation <= 3) {
    yDomain = [Math.max(min - 1, 0), max + 1];
  } else {
    yDomain = [Math.max(min - 2, 0), max + 2];
  }
  
  console.log({
    minValue: min,
    maxValue: max,
    variation: variation,
    yDomain: yDomain,
    chartHeight: chartHeight
  });
});
