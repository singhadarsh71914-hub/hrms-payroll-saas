import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });

async function run() {
  await client.connect();
  const res = await client.query('SELECT u.id, u.email, u.role, e.id as employee_id FROM "User" u LEFT JOIN "Employee" e ON u.id = e.user_id');
  console.table(res.rows);
  await client.end();
}
run();
