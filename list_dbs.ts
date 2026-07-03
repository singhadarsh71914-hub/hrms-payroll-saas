
import pg from 'pg';

async function listDbs() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });
  try {
    const res = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
    console.log('Databases:', res.rows.map(r => r.datname));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listDbs();
