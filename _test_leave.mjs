

async function testLeave() {
  const url = 'http://localhost:3000/api';
  
  // 1. Log in
  const loginRes = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hrms.local', password: 'password123' }) // assuming default
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  console.log('--- TEST: /api/leave/balances ---');
  const balRes = await fetch(`${url}/leave/balances`, { headers });
  console.log(`STATUS: ${balRes.status}`);
  console.log(`RESPONSE: ${await balRes.text()}`);

  console.log('\n--- TEST: /api/leave/requests ---');
  const reqRes = await fetch(`${url}/leave/requests`, { headers });
  console.log(`STATUS: ${reqRes.status}`);
  console.log(`RESPONSE: ${await reqRes.text()}`);

  console.log('\n--- TEST: /api/leave/apply ---');
  const applyRes = await fetch(`${url}/leave/apply`, { 
    method: 'POST',
    headers,
    body: JSON.stringify({ leaveType: 'CASUAL', startDate: '2026-06-20', endDate: '2026-06-21', reason: 'Test' })
  });
  console.log(`STATUS: ${applyRes.status}`);
  console.log(`RESPONSE: ${await applyRes.text()}`);

  console.log('\n--- TEST: /api/leave (Root GET) ---');
  const rootGet = await fetch(`${url}/leave`, { headers });
  console.log(`STATUS: ${rootGet.status}`);
  
  console.log('\n--- TEST: /api/leave (Root POST) ---');
  const rootPost = await fetch(`${url}/leave`, { method: 'POST', headers, body: JSON.stringify({}) });
  console.log(`STATUS: ${rootPost.status}`);
}

testLeave();
