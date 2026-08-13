const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  try {
    const email = 'attendance.test@company.com';
    const passwordHash = await bcrypt.hash('Test@123', 10);
    
    let res = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      const companyRes = await client.query('SELECT id FROM "Company" LIMIT 1');
      const companyId = companyRes.rows[0].id;
      
      const userId = uuidv4();
      await client.query(
        'INSERT INTO "User" (id, email, password_hash, role, email_verified, company_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, email, passwordHash, 'EMPLOYEE', true, companyId, new Date()]
      );
      
      const empId = uuidv4();
      await client.query(
        'INSERT INTO "Employee" (id, company_id, user_id, first_name, last_name, work_email, employee_code, employment_status, date_of_joining, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [empId, companyId, userId, 'Test', 'Attendance', email, 'TEST-ATT-01', 'ACTIVE', new Date(), new Date()]
      );

      // assign shift
      const shiftRes = await client.query('SELECT id FROM "shifts" WHERE company_id = $1 LIMIT 1', [companyId]);
      if (shiftRes.rows.length > 0) {
        await client.query('UPDATE "Employee" SET shift_id = $1 WHERE id = $2', [shiftRes.rows[0].id, empId]);
      }
      
      console.log('Created test employee');
    } else {
      console.log('Test employee already exists');
      await client.query('UPDATE "User" SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
      
      // also clear their attendance for today so test can run
      const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [email]);
      const empRes = await client.query('SELECT id FROM "Employee" WHERE user_id = $1', [userRes.rows[0].id]);
      if (empRes.rows.length > 0) {
        await client.query('DELETE FROM "attendance_breaks" WHERE attendance_id IN (SELECT id FROM "Attendance" WHERE employee_id = $1)', [empRes.rows[0].id]);
        await client.query('DELETE FROM "Attendance" WHERE employee_id = $1', [empRes.rows[0].id]);
        console.log('Cleared all attendance for test employee');
      }
    }
  } finally {
    await client.end();
  }
}

run();
