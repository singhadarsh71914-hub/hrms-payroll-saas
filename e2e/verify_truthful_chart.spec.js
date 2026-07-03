import { test } from '@playwright/test';

test('verify truthful chart', async ({ page }) => {
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5182/analytics');
  await page.waitForTimeout(2500);

  const measurements = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="headcount-card"]');
    if (!card) return { error: 'Card not found' };

    const svg = card.querySelector('.recharts-surface');
    const caption = Array.from(card.querySelectorAll('span')).find(el => 
      el.textContent?.includes('history') || el.textContent?.includes('tracking')
    );
    const cardRect = card.getBoundingClientRect();
    const svgRect = svg?.getBoundingClientRect();

    const path = card.querySelector('.recharts-area-area');
    const pathBBox = path?.getBoundingClientRect();

    return {
      cardWidth: Math.round(cardRect.width),
      svgWidth: svgRect ? Math.round(svgRect.width) : null,
      svgFitsCard: svgRect ? svgRect.width <= cardRect.width + 2 : null,
      captionText: caption?.textContent?.trim() || null,
      pathLeft: pathBBox ? Math.round(pathBBox.left - cardRect.left) : null,
      pathRight: pathBBox ? Math.round(pathBBox.right - cardRect.left) : null,
    };
  });

  console.log("=== FINAL MEASUREMENTS ===");
  console.log(JSON.stringify(measurements, null, 2));

  await page.screenshot({ 
    path: 'C:\\Users\\singh\\.gemini\\antigravity-cli\\brain\\4b005a0d-c79f-4110-9690-70ac035cd54f\\truthful_chart.png',
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 900 }
  });
});
