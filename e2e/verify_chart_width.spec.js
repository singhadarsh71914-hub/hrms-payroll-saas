import { test } from '@playwright/test';

test('verify chart width fix', async ({ page }) => {
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

    const svg = card.querySelector('.recharts-surface');
    if (!svg) return { error: 'SVG not found' };

    const chartWrapper = svg.closest('.recharts-area-chart')?.parentElement?.parentElement;
    const cardRect = card.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const wrapperRect = chartWrapper ? chartWrapper.getBoundingClientRect() : null;

    return {
      cardWidth: Math.round(cardRect.width),
      svgWidth: Math.round(svgRect.width),
      chartWrapperWidth: wrapperRect ? Math.round(wrapperRect.width) : null,
      svgFitsCard: svgRect.width <= cardRect.width + 2,
    };
  });

  console.log("=== VERIFIED MEASUREMENTS ===");
  console.log(JSON.stringify(measurements, null, 2));
});
