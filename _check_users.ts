import pg from 'pg';
const client = new pg.Client({connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project'});
client.connect().then(async () => {
  const res = await client.query('SELECT role, count(u.id) FROM "User" u LEFT JOIN "Employee" e ON u.id = e.user_id GROUP BY role');
  console.log('All Users:', res.rows);
  const res2 = await client.query('SELECT role, count(u.id) as with_employee FROM "User" u JOIN "Employee" e ON u.id = e.user_id GROUP BY role');
  console.log('Users with Employee records:', res2.rows);
  await client.end();
});
