import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const res = await pool.query('UPDATE "Attendance" SET date = $1, check_in = $2, check_out = NULL', [today, new Date()]);
  console.log("Updated records:", res.rowCount);
}
run().finally(() => pool.end());
