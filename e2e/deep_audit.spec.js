import { test, expect } from '@playwright/test';

test('headcount deep audit', async ({ page }) => {
  // Login first
  await page.goto('http://localhost:5182/login');
  await page.fill('input[type="email"]', 'admin@e2e.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Intercept the analytics headcount call
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/api/analytics/headcount') && response.status() === 200
  );

  await page.goto('http://localhost:5182/analytics');
  
  await responsePromise;
  
  await page.waitForTimeout(2000); // let recharts render and animate
  
  console.log("=== STEP 1: DOM AUDIT ===");
  const audit = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="headcount-card"]');
    if (!card) return null;
    
    const wrapper = card.querySelector('.recharts-wrapper')?.parentElement;
    const rechartsWrapper = card.querySelector('.recharts-wrapper');
    const svg = card.querySelector('svg.recharts-surface');
    const path = card.querySelector('path.recharts-area-area');
    
    // Add visual borders for the screenshot
    if (wrapper) wrapper.style.border = '2px solid magenta';
    if (rechartsWrapper) rechartsWrapper.style.border = '2px solid blue';
    if (svg) svg.style.border = '2px solid lime';
    if (path) path.style.stroke = 'yellow';
    
    let pathBoundingBox = null;
    let visibleLineHeight = 0;
    let firstPointY = 0;
    let lastPointY = 0;
    
    if (path) {
      const bbox = path.getBBox();
      pathBoundingBox = {
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height
      };
      visibleLineHeight = bbox.height;
      
      const d = path.getAttribute('d');
      const commands = d.split(' ');
      // naive extraction of Y coords (M x,y) (L x,y)
      // M 44.92,100 L 157.06,100 ...
      const points = [];
      for (let i = 0; i < commands.length; i++) {
        if (commands[i] === 'M' || commands[i] === 'L') {
          const coords = commands[i+1].split(',');
          points.push(parseFloat(coords[1]));
        }
      }
      
      if (points.length > 0) {
        firstPointY = points[0];
        lastPointY = points[points.length - 1];
      }
    }
    
    return {
      cardHeight: card.getBoundingClientRect().height,
      wrapperHeight: wrapper ? wrapper.getBoundingClientRect().height : 0,
      rechartsWrapperHeight: rechartsWrapper ? rechartsWrapper.getBoundingClientRect().height : 0,
      svgHeight: svg ? svg.getBoundingClientRect().height : 0,
      pathBoundingBox: pathBoundingBox,
      visibleLineHeight: visibleLineHeight,
      firstPointY: firstPointY,
      lastPointY: lastPointY
    };
  });
  
  console.log(audit);
  
  await page.screenshot({ path: 'e2e/deep_audit_screenshot.png' });
});
