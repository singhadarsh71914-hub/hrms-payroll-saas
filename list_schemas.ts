
import pg from 'pg';

async function listSchemas() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
  try {
    const res = await pool.query("SELECT nspname FROM pg_catalog.pg_namespace;");
    console.log('Schemas:', res.rows.map(r => r.nspname));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listSchemas();
