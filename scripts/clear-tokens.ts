import pg from 'pg';
const { Client } = pg;
async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
  await client.connect();
  await client.query(`UPDATE "User" SET email_verification_token=null, email_verification_expires_at=null WHERE email='singhadarsh71914@gmail.com'`);
  await client.end();
}
run();
