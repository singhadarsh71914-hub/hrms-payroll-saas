import jwt from 'jsonwebtoken';

async function run() {
  const token = jwt.sign(
    { userId: '123', role: 'HR', companyId: '456' }, 
    'your_super_secret_jwt_key_change_this_in_production', 
    { expiresIn: '1h' }
  );

  const res = await fetch('http://localhost:3000/api/attendance/intelligence', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!res.ok) {
    console.log(res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
