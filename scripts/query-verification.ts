import pg from 'pg';
const { Client } = pg;

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
  await client.connect();
  const res = await client.query(`SELECT email, email_verified, email_verification_token, email_verification_expires_at FROM "User" WHERE email='singhadarsh71914@gmail.com'`);
  console.log(res.rows);
  await client.end();
}
run();
