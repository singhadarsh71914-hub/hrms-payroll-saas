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
    const leftPanel = document.querySelector('.recharts-responsive-container')?.parentElement?.previousElementSibling;
    const chartWrapper = document.querySelector('.recharts-responsive-container')?.parentElement;
    const svg = document.querySelector('.recharts-surface');
    const yAxis = document.querySelector('.recharts-yAxis');
    
    return {
      leftPanelWidth: leftPanel ? leftPanel.getBoundingClientRect().width : null,
      chartWrapperWidth: chartWrapper ? chartWrapper.getBoundingClientRect().width : null,
      svgWidth: svg ? svg.getBoundingClientRect().width : null,
      yAxisWidth: yAxis ? yAxis.getBoundingClientRect().width : null,
    };
  });

  console.log("=== GRAPH MEASUREMENTS ===");
  console.log(JSON.stringify(measurements, null, 2));
});
