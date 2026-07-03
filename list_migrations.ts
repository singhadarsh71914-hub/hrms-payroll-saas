
import pg from 'pg';

async function listMigrations() {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
  try {
    const res = await pool.query("SELECT migration_name, applied_steps_count, finished_at FROM _prisma_migrations;");
    console.log('Migrations:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listMigrations();
