import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting Playwright test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  try {
    console.log('1. Logging in...');
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[type="email"]', 'admin@e2e.com');
    await page.fill('input[type="password"]', 'Admin@123456');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('Logged in successfully!');
    
    console.log('2. Navigating to Add Employee...');
    await page.goto('http://localhost:5173/employees/add', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('3. Filling out basic employee profile...');
    const randomCode = 'EMP-' + Math.floor(Math.random() * 10000);
    await page.fill('input[name="employee_code"]', randomCode);
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="work_email"]', `john.doe.${randomCode}@company.com`);
    await page.fill('input[name="date_of_joining"]', '2026-07-01');
    
    // Govt IDs
    await page.fill('input[name="pan_number"]', 'ABCDE1234F');
    // Bank Details
    await page.fill('input[name="bank_account_number"]', '1234567890');
    await page.fill('input[name="bank_ifsc"]', 'HDFC0001234');
    
    console.log('4. Saving new employee...');
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/employees') && res.request().method() === 'POST'),
      page.click('button[type="submit"]')
    ]);
    
    const responseBody = await response.json();
    console.log('Employee created:', responseBody);
    
    const employeeId = responseBody.id;
    if (!employeeId) throw new Error('Failed to create employee, no ID returned.');

    console.log('5. Viewing employee profile (EmployeeDetails)...');
    await page.goto(`http://localhost:5173/employees/${employeeId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    console.log('6. Uploading Profile Photo...');
    const dummyImgPath = path.join(process.cwd(), 'dummy.png');
    fs.writeFileSync(dummyImgPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    
    const [uploadResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/avatar') && res.request().method() === 'POST'),
      page.setInputFiles('input[type="file"]', dummyImgPath)
    ]);
    const uploadResult = await uploadResponse.json();
    console.log('Avatar upload response:', uploadResult);
    if (!uploadResult.avatar_url) throw new Error('Avatar URL not returned');

    console.log('7. Editing profile and bank details...');
    await page.goto(`http://localhost:5173/employees/edit/${employeeId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="bank_branch"]', 'Main Branch');
    
    const [editResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes(`/api/employees/${employeeId}`) && res.request().method() === 'PUT'),
      page.click('button[type="submit"]')
    ]);
    
    console.log('Edit Response:', await editResponse.json());

    console.log('8. Deleting Employee...');
    await page.goto('http://localhost:5173/employees', { waitUntil: 'networkidle' });
    
    const deleteRes = await page.evaluate(async (id) => {
      const res = await fetch(`http://localhost:3000/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      return await res.json();
    }, employeeId);
    
    console.log('Delete response:', deleteRes);

    console.log('ALL TESTS PASSED SUCCESSFULLY');
    
  } catch (error) {
    console.error('TEST FAILED:', error);
  } finally {
    await browser.close();
  }
})();
