import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const { Client } = pg;

async function globalSetup() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
  await client.connect();

  const hash = await bcrypt.hash('password123', 10);
  
  // Seed Company
  const compId = crypto.randomUUID();
  await client.query(`INSERT INTO "Company" (id, name, created_at, updated_at) VALUES ($1, 'E2E Corp', NOW(), NOW()) ON CONFLICT DO NOTHING`, [compId]);
  
  const cRes = await client.query(`SELECT id FROM "Company" WHERE name = 'E2E Corp' LIMIT 1`);
  const companyId = cRes.rows[0].id;

  async function createPerson(email, role, firstName, code) {
    const userId = crypto.randomUUID();
    const empId = crypto.randomUUID();
    await client.query(`INSERT INTO "User" (id, email, password_hash, role, company_id, email_verified, created_at, updated_at, is_active) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW(), true) ON CONFLICT (email) DO UPDATE SET password_hash = $3, email_verified = true, is_active = true, scheduled_purge_at = null`, [userId, email, hash, role, companyId]);
    const uRes = await client.query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [email]);
    const uId = uRes.rows[0].id;

    const eRes = await client.query(`SELECT id FROM "Employee" WHERE employee_code = $1 LIMIT 1`, [code]);
    if (eRes.rows.length === 0) {
      await client.query(`
        INSERT INTO "Employee" (id, user_id, company_id, first_name, last_name, work_email, employee_code, employment_status, date_of_joining, created_at, updated_at, is_active) 
        VALUES ($1, $2, $3, $4, 'User', $5, $6, 'ACTIVE', NOW(), NOW(), NOW(), true)
      `, [empId, uId, companyId, firstName, email, code]);
    } else {
      await client.query(`UPDATE "Employee" SET is_active = true, deleted_at = null WHERE employee_code = $1`, [code]);
    }
  }

  await createPerson('admin@e2e.com', 'ADMIN', 'Admin', 'E2E-A001');
  await createPerson('deletion@e2e.com', 'ADMIN', 'Deletion', 'E2E-D001');
  await createPerson('hr@e2e.com', 'HR', 'HR', 'E2E-H001');
  await createPerson('mgr@e2e.com', 'MANAGER', 'Manager', 'E2E-M001');
  await createPerson('emp@e2e.com', 'EMPLOYEE', 'Employee', 'E2E-E001');

  const unverifiedUserId = crypto.randomUUID();
  await client.query(`INSERT INTO "User" (id, email, password_hash, role, company_id, email_verified, created_at, updated_at) VALUES ($1, 'unverified@e2e.com', $2, 'ADMIN', $3, false, NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET password_hash = $2, email_verified = false`, [unverifiedUserId, hash, companyId]);

  // Reset leaves for emp@e2e.com
  await client.query(`DELETE FROM "LeaveRequest" WHERE employee_id IN (SELECT id FROM "Employee" WHERE work_email = 'emp@e2e.com')`);
  await client.query(`DELETE FROM "LeaveBalance" WHERE employee_id IN (SELECT id FROM "Employee" WHERE work_email = 'emp@e2e.com')`);

  await client.end();
  console.log('E2E Data Setup Complete');
}

export default globalSetup;

