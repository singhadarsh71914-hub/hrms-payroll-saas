import { Client } from 'pg';

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });

async function checkIndexes() {
  await client.connect();
  const res = await client.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE '%_idx%'
  `);
  console.log(res.rows);
  await client.end();
}

checkIndexes();
