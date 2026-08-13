const { Client } = require('pg');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  try {
    await client.query('DELETE FROM "Employee" WHERE work_email = \'attendance.test@company.com\'');
    await client.query('DELETE FROM "User" WHERE email = \'attendance.test@company.com\'');
    console.log('Deleted successfully');
  } finally {
    await client.end();
  }
}

run();
