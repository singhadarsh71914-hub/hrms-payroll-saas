import fetch from 'node-fetch';
(async () => {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test' })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
})();
