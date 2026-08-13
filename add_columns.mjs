import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('ALTER TABLE "Employee" ADD COLUMN "bank_branch" TEXT;');
  await client.query('ALTER TABLE "Employee" ADD COLUMN "bank_account_holder" TEXT;');
  console.log('Columns added!');
} catch(e) {
  console.log(e);
}
const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Employee'`);
console.log(res.rows.map(r => r.column_name));
await client.end();
