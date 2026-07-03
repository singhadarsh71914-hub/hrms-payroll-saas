import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query('SELECT email FROM "User"');
  console.log(res.rows);
}
run().finally(() => pool.end());
