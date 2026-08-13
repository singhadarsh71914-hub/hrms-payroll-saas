const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  try {
    const r = await client.query('SELECT u.id as uid, e.id as eid, u.email FROM "User" u LEFT JOIN "Employee" e ON u.id = e.user_id WHERE u.email = \'attendance.test@company.com\'');
    console.log(r.rows);
  } finally {
    await client.end();
  }
}

run();
