import axios from 'axios';

async function runApiBenchmarks() {
  const axiosInstance = axios.create({ baseURL: 'http://localhost:3000/api' });

  // Login to get token
  let token = '';
  try {
    const loginRes = await axiosInstance.post('/auth/login', {
      email: 'admin@e2e.com',
      password: 'password'
    });
    token = loginRes.data.accessToken;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    console.error('Login failed:', e.response?.data || e.message);
    return;
  }

  const endpoints = [
    { name: 'Dashboard API', path: '/dashboard/stats' },
    { name: 'Analytics API', path: '/analytics/kpis' },
    { name: 'Employee List API', path: '/employees' },
    { name: 'Attendance API', path: '/attendance/summary' },
    { name: 'Payroll API', path: '/payroll/runs' },
    { name: 'Documents API', path: '/documents' },
    { name: 'Workforce Intelligence API', path: '/intelligence/dashboard' }
  ];

  console.log('--- API BENCHMARKS (10 runs) ---');
  for (const ep of endpoints) {
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      try {
        await axiosInstance.get(ep.path);
        times.push(Date.now() - start);
      } catch (e) {
        // Just record failure as high number or handle
        console.error(`Failed ${ep.path}: ${e.response?.status}`);
      }
    }
    
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      console.log(`${ep.name}: Avg: ${avg.toFixed(2)}ms | Min: ${min}ms | Max: ${max}ms`);
    }
  }
}

runApiBenchmarks();
