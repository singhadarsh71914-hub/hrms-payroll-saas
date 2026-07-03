import pg from 'pg';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const BASE_URL = 'http://localhost:3000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';

async function run() {
  await client.connect();

  const hrRes = await client.query(`
    SELECT u.id, u.email, u.role, u.company_id, e.id as employee_id 
    FROM "User" u 
    LEFT JOIN "Employee" e ON u.id = e.user_id 
    WHERE u.role = 'ADMIN' OR u.role = 'HR'
    LIMIT 1
  `);
  const user = hrRes.rows[0];
  console.log('1. Logged-in User:', user);

  const notifs = await client.query(`
    SELECT * FROM "Notification"
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [user.id]);
  console.log('2. Notification DB Records for this user:', notifs.rows.length);

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const apiRes = await axios.get(`${BASE_URL}/notifications`, { headers });
    console.log('3. GET /api/notifications Status:', apiRes.status);
    console.log('API Response Body length:', apiRes.data.data.length);
  } catch(e: any) {
    console.log(e.response?.data);
  }

  await client.end();
}
run();
