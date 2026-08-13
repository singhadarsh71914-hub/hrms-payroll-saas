import { test, expect } from '@playwright/test';

test('audit corrupted states', async ({ page }) => {
  const logErrors = async (stateName, setup) => {
    const errors = [];
    const warnings = [];
    
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') warnings.push(msg.text());
    });

    await page.goto('http://localhost:5173/login');
    await page.evaluate(setup);
    
    console.log(`\n=== TESTING STATE: ${stateName} ===`);
    await page.goto('http://localhost:5173/analytics');
    await page.waitForTimeout(3000);
    
    console.log("ERRORS:", errors);
    console.log("WARNINGS:", warnings);
    
    page.removeAllListeners('pageerror');
    page.removeAllListeners('console');
  };

  // State 1: User exists, token missing
  await logErrors('User exists, no token', () => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'HR' }));
  });

  // State 2: Token exists, user missing
  await logErrors('Token exists, no user', () => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
  });

  // State 3: Both exist but invalid
  await logErrors('Both invalid', () => {
    localStorage.clear();
    localStorage.setItem('accessToken', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'HR' }));
  });
});
