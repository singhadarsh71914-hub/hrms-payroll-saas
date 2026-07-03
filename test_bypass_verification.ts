
import axios from 'axios';
import http from 'http';
import app from './src/index.ts';

const PORT = 3339;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTest = async () => {
  const server = http.createServer(app);
  
  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`Test server started on ${PORT}`);
      resolve();
    });
  });

  console.log('--- STARTING BYPASS VERIFICATION TEST ---');
  
  const email = `bypass_test_${Date.now()}@example.com`;
  const password = 'Password123!';

  try {
    // 1. Register
    console.log('Registering test user...');
    await axios.post(`${BASE_URL}/auth/register`, {
      email,
      password,
      company_name: 'Bypass Corp'
    });

    // 2. Perform 25 failed logins (exceeding relaxed limit of 20)
    console.log('Performing 25 failed login attempts (should NOT be blocked due to bypass)...');
    for (let i = 1; i <= 25; i++) {
      try {
        await axios.post(`${BASE_URL}/auth/login`, { email, password: 'wrongpassword' });
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.error(`FAILED: Blocked by 429 on attempt ${i}. Bypass not working!`);
          process.exit(1);
        }
      }
    }
    console.log('Successfully performed 25 failed attempts without 429.');

    // 3. Login with correct password
    console.log('Verifying login with correct credentials...');
    const successRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    console.log(`Login Status: ${successRes.status}`);
    
    if (successRes.status === 200) {
      console.log('SUCCESS: Bypass verified. Login successful after exceeding limit.');
    }

  } catch (error: any) {
    console.error('Test error:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  } finally {
    server.close();
    console.log('--- TEST COMPLETE ---');
  }
};

runTest().catch(console.error);
