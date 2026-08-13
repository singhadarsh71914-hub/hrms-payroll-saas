import puppeteer from 'puppeteer';

async function runBrowserBenchmarks() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set window size for desktop
  await page.setViewport({ width: 1920, height: 1080 });

  // Measure before login memory
  const memoryBeforeLogin = await page.evaluate(() => (performance as any).memory.usedJSHeapSize / 1024 / 1024);
  console.log(`JS Heap Before Login: ${memoryBeforeLogin.toFixed(2)} MB`);

  // Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@e2e.com');
  await page.type('input[type="password"]', 'password');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);

  // Capture metrics for Dashboard
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const dashboardMetrics = await page.evaluate(() => {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    const fcp = fcpEntry ? fcpEntry.startTime : 0;
    
    // LCP is tricky without PerformanceObserver, but we can approximate or use FCP
    return {
      fcp,
      heap: (performance as any).memory.usedJSHeapSize / 1024 / 1024
    };
  });
  console.log(`JS Heap After Dashboard: ${dashboardMetrics.heap.toFixed(2)} MB`);
  console.log(`Dashboard FCP: ${dashboardMetrics.fcp.toFixed(2)} ms`);

  // Navigate 20 times to check memory leaks
  console.log('Navigating 20 times...');
  for (let i = 0; i < 10; i++) {
    await page.goto('http://localhost:5173/employees', { waitUntil: 'domcontentloaded' });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'domcontentloaded' });
  }

  // Force garbage collection if possible (requires --expose-gc flag, but we'll just check current)
  const memoryAfterNavs = await page.evaluate(() => (performance as any).memory.usedJSHeapSize / 1024 / 1024);
  console.log(`JS Heap After 20 Navigations: ${memoryAfterNavs.toFixed(2)} MB`);

  // Intercept requests to count them per page
  const pageNetwork = await browser.newPage();
  let reqCount = 0;
  pageNetwork.on('request', request => {
    if (request.url().includes('/api/')) reqCount++;
  });

  // Login again in new context to avoid sharing cache (or just use existing cookies)
  const cookies = await page.cookies();
  await pageNetwork.setCookie(...cookies);

  const pagesToTest = ['/dashboard', '/analytics', '/employees', '/payroll'];
  console.log('--- API Requests / Page ---');
  for (const p of pagesToTest) {
    reqCount = 0;
    await pageNetwork.goto(`http://localhost:5173${p}`, { waitUntil: 'networkidle0' });
    console.log(`${p}: ${reqCount} requests`);
  }

  await browser.close();
}

runBrowserBenchmarks().catch(console.error);
