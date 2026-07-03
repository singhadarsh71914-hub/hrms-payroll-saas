import { test, expect } from '@playwright/test';

test('measure headcount growth graph', async ({ page }) => {
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5182/analytics');
  await page.waitForTimeout(2000);

  const measurements = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="headcount-card"]');
    if (!card) return { error: 'Card not found' };

    // The grid container
    const contentSplit = card.children[1];
    if (!contentSplit) return { error: 'Content split not found' };

    const leftPanel = contentSplit.children[0];
    const rightRegion = contentSplit.children[1];
    
    // The chart wrapper inside right region
    const chartWrapper = rightRegion.children[0];
    
    // The SVG inside chart wrapper
    const svg = chartWrapper.querySelector('.recharts-surface');
    
    return {
      leftPanelWidth: leftPanel ? leftPanel.getBoundingClientRect().width : null,
      rightRegionWidth: rightRegion ? rightRegion.getBoundingClientRect().width : null,
      chartWrapperWidth: chartWrapper ? chartWrapper.getBoundingClientRect().width : null,
      svgWidth: svg ? svg.getBoundingClientRect().width : null,
    };
  });

  console.log("=== GRAPH MEASUREMENTS ===");
  console.log(JSON.stringify(measurements, null, 2));
});
