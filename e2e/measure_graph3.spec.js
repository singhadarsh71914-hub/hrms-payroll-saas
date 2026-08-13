import { test, expect } from '@playwright/test';

test('measure headcount growth graph', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/analytics');
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="headcount-card"]');
    if (!card) return { error: 'Card not found' };

    const svg = card.querySelector('.recharts-surface');
    if (!svg) return { error: 'SVG not found' };

    const chartWrapper = svg.parentElement;
    const rightRegion = chartWrapper?.parentElement?.parentElement;
    const leftPanel = rightRegion?.previousElementSibling;
    const marginContainer = svg.querySelector('.recharts-cartesian-grid');
    
    let chartMargins = null;
    if (marginContainer) {
       chartMargins = {
         x: marginContainer.getAttribute('x'),
         y: marginContainer.getAttribute('y'),
         width: marginContainer.getAttribute('width'),
         height: marginContainer.getAttribute('height')
       };
    }

    return {
      leftPanelWidth: leftPanel ? leftPanel.getBoundingClientRect().width : null,
      chartWrapperWidth: chartWrapper ? chartWrapper.getBoundingClientRect().width : null,
      svgWidth: svg ? svg.getBoundingClientRect().width : null,
      chartMargins: chartMargins,
      yAxisWidth: card.querySelector('.recharts-yAxis')?.getBoundingClientRect()?.width || 0
    };
  });

  console.log("=== GRAPH MEASUREMENTS ===");
  console.log(JSON.stringify(measurements, null, 2));
});
