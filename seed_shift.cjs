const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT id FROM "Company" LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No company found');
      return;
    }
    const companyId = res.rows[0].id;

    // Check if shift already exists
    const shiftRes = await client.query('SELECT id FROM "shifts" WHERE company_id = $1 LIMIT 1', [companyId]);
    let shiftId;
    if (shiftRes.rows.length === 0) {
      shiftId = uuidv4();
      await client.query(`
        INSERT INTO "shifts" (id, company_id, name, start_time, end_time, grace_period, half_day_hours, working_days, is_overnight)
        VALUES ($1, $2, 'Standard Shift', '09:00', '18:00', 15, 4, ARRAY[1,2,3,4,5], false)
      `, [shiftId, companyId]);
      console.log('Created Standard Shift');
    } else {
      shiftId = shiftRes.rows[0].id;
      console.log('Shift already exists');
    }

    // Assign to all employees
    await client.query('UPDATE "Employee" SET shift_id = $1 WHERE shift_id IS NULL', [shiftId]);
    console.log('Assigned standard shift to all employees');

  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
