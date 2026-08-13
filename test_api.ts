import axios from 'axios';

async function testPerformance() {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api'
  });

  console.log('Logging in...');
  let token = '';
  try {
    const loginRes = await axiosInstance.post('/auth/login', {
      email: 'admin@e2e.com',
      password: 'Password123!'
    });
    token = loginRes.data.token;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Login successful.');
  } catch (e) {
    console.log('Login failed:', e.response?.data || e.message);
    return;
  }

  const endpoints = [
    '/dashboard/stats',
    '/analytics/workforce-metrics?range=6m',
    '/employees'
  ];

  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await axiosInstance.get(ep);
      const duration = Date.now() - start;
      console.log(`[PASS] ${ep} - ${duration}ms`);
    } catch (e) {
      console.log(`[FAIL] ${ep} - Error: ${e.response?.data || e.message}`);
    }
  }
}

testPerformance();

testPerformance();
