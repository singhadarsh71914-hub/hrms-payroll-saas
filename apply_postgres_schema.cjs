const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  console.log('Connected to DB');
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "shifts" (
        "id" TEXT NOT NULL,
        "company_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "start_time" TEXT NOT NULL,
        "end_time" TEXT NOT NULL,
        "grace_period" INTEGER NOT NULL DEFAULT 15,
        "half_day_hours" INTEGER NOT NULL DEFAULT 4,
        "working_days" INTEGER[] NOT NULL,
        "is_overnight" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created shifts table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "attendance_breaks" (
        "id" TEXT NOT NULL,
        "attendance_id" TEXT NOT NULL,
        "start_time" TIMESTAMP(3) NOT NULL,
        "end_time" TIMESTAMP(3),
        "duration" INTEGER,
        CONSTRAINT "attendance_breaks_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created attendance_breaks table');

    // add foreign keys
    try {
      await client.query(`
        ALTER TABLE "attendance_breaks" 
        ADD CONSTRAINT "attendance_breaks_attendance_id_fkey" 
        FOREIGN KEY ("attendance_id") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      console.log('Added foreign key for attendance_breaks');
    } catch(e) { console.log('FK for attendance_breaks may already exist', e.message); }

    try {
      await client.query(`
        ALTER TABLE "Employee" ADD COLUMN "shift_id" TEXT;
      `);
      await client.query(`
        ALTER TABLE "Employee" 
        ADD CONSTRAINT "Employee_shift_id_fkey" 
        FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('Added shift_id to Employee');
    } catch(e) { console.log('Column shift_id may already exist', e.message); }

    try {
      await client.query(`
        ALTER TABLE "Attendance" 
        ADD COLUMN "working_hours" DECIMAL(10,2),
        ADD COLUMN "break_hours" DECIMAL(10,2),
        ADD COLUMN "late_minutes" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN "early_exit_minutes" INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN "is_half_day" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN "is_holiday" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN "is_weekend" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('Added columns to Attendance');
    } catch(e) { console.log('Columns to Attendance may already exist', e.message); }

  } catch(e) {
    console.error('Error applying schema', e);
  } finally {
    await client.end();
  }
}

run();
