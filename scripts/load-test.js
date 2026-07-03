const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = `http://localhost:${PORT}/api`;

const endpoints = [
  { method: 'POST', path: '/auth/login', body: { email: 'admin@company.com', password: 'password' } },
  { method: 'GET', path: '/dashboard' },
  { method: 'GET', path: '/attendance' },
  { method: 'GET', path: '/leave' },
  { method: 'GET', path: '/notifications' }
];

async function makeRequest(endpoint, token = '') {
  const start = Date.now();
  try {
    const url = new URL(`${HOST}${endpoint.path}`);
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    
    // using fetch API native in node 18+
    const res = await fetch(url.toString(), {
      ...options,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
    });
    
    let responseToken = '';
    if (endpoint.path === '/auth/login') {
      const data = await res.json();
      responseToken = data.accessToken || '';
    } else {
      await res.text(); // consume body
    }
    
    return { success: res.ok, duration: Date.now() - start, token: responseToken };
  } catch (err) {
    return { success: false, duration: Date.now() - start };
  }
}

async function runScenario(users) {
  console.log(`\nStarting load test with ${users} concurrent users...`);
  const promises = [];
  
  for (let i = 0; i < users; i++) {
    promises.push((async () => {
      const results = [];
      let token = '';
      for (const endpoint of endpoints) {
        const res = await makeRequest(endpoint, token);
        if (res.token) token = res.token;
        results.push(res);
      }
      return results;
    })());
  }

  const allResults = await Promise.all(promises);
  const flatResults = allResults.flat();
  
  const durations = flatResults.map(r => r.duration).sort((a, b) => a - b);
  const failures = flatResults.filter(r => !r.success).length;
  const failureRate = ((failures / flatResults.length) * 100).toFixed(2);
  
  const avg = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
  
  console.log(`Results for ${users} users:`);
  console.log(`Average Response Time: ${avg}ms`);
  console.log(`P95 Response Time: ${p95}ms`);
  console.log(`P99 Response Time: ${p99}ms`);
  console.log(`Failure Rate: ${failureRate}%`);
}

async function main() {
  await runScenario(100);
  await runScenario(500);
  await runScenario(1000);
}

main().catch(console.error);
