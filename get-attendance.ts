import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query('SELECT * FROM "Attendance" ORDER BY date DESC LIMIT 5');
  console.log(res.rows);
}
run().finally(() => pool.end());
