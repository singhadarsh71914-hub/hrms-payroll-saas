import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function run() {
  console.log('Starting Vite dev server...');
  const server = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), shell: true });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Launching Puppeteer...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', async msg => {
    const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text(), args);
  });

  page.on('pageerror', err => {
    console.log('BROWSER PAGE ERROR:', err.message);
    console.log(err.stack);
  });

  console.log('Navigating to /attendance/intelligence...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'HR', name: 'Test' }));
  });
  await page.goto('http://localhost:5173/attendance/intelligence', { waitUntil: 'networkidle0' });

  // Wait a moment for any async React errors
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const crashReport = await page.evaluate(() => {
      const el = document.getElementById('crash-report');
      if (el) {
        return {
          msg: document.getElementById('crash-msg')?.innerText,
          stack: document.getElementById('crash-stack')?.innerText
        };
      }
      return null;
    });
    if (crashReport) {
      console.log('--- FOUND CRASH IN DOM ---');
      console.log('MSG:', crashReport.msg);
      console.log('STACK:', crashReport.stack);
    } else {
      console.log('No #crash-report found in DOM.');
    }
  } catch(e) {
    console.error('Error reading DOM:', e);
  }

  console.log('Closing browser...');
  await browser.close();
  server.kill();
  process.exit(0);
}

run().catch(console.error);
