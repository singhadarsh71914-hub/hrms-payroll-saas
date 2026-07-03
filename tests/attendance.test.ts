import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttendanceService } from '../src/services/attendance.service';
import prisma from '../src/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { AttendanceStatus } from '@prisma/client';
import 'dotenv/config';

describe('Attendance A1/B1/C1 Rules Integration', () => {
  let companyId: string;
  let adminUserId: string;
  let employeeUserId1: string;
  let employeeId1: string;
  let employeeUserId2: string;
  let employeeId2: string;

  beforeAll(async () => {
    companyId = uuidv4();
    await prisma.company.create({ data: { id: companyId, name: 'Test Co' } });

    adminUserId = uuidv4();
    await prisma.user.create({ data: { id: adminUserId, email: 'admin' + uuidv4() + '@test.com', password_hash: '123', role: 'ADMIN', company_id: companyId } });

    employeeUserId1 = uuidv4();
    employeeId1 = uuidv4();
    await prisma.user.create({ data: { id: employeeUserId1, email: 'emp1' + uuidv4() + '@test.com', password_hash: '123', role: 'EMPLOYEE', company_id: companyId } });
    await prisma.employee.create({ data: { id: employeeId1, user_id: employeeUserId1, company_id: companyId, first_name: 'E1', last_name: 'L1', employee_code: 'E' + Date.now() + '1', work_email: 'emp1' + uuidv4() + '@test.com', date_of_joining: new Date() } });

    employeeUserId2 = uuidv4();
    employeeId2 = uuidv4();
    await prisma.user.create({ data: { id: employeeUserId2, email: 'emp2' + uuidv4() + '@test.com', password_hash: '123', role: 'EMPLOYEE', company_id: companyId } });
    await prisma.employee.create({ data: { id: employeeId2, user_id: employeeUserId2, company_id: companyId, first_name: 'E2', last_name: 'L2', employee_code: 'E' + Date.now() + '2', work_email: 'emp2' + uuidv4() + '@test.com', date_of_joining: new Date() } });
  });

  afterAll(async () => {
    const employees = await prisma.employee.findMany({ where: { company_id: companyId } });
    const employeeIds = employees.map((e: any) => e.id);
    await prisma.attendance.deleteMany({ where: { employee_id: { in: employeeIds } } });
    await prisma.employee.deleteMany({ where: { company_id: companyId } });
    await prisma.user.deleteMany({ where: { company_id: companyId } });
    await prisma.company.deleteMany({ where: { id: companyId } });
  });

  it('employee self attendance creates EMPLOYEE_SELF record', async () => {
    const record = await AttendanceService.checkIn(employeeId1, companyId, employeeUserId1, {});
    expect(record.source).toBe('EMPLOYEE_SELF');
    expect(record.submitted_by_user_id).toBe(employeeUserId1);
    expect(record.status).toBe('PRESENT');
  });

  it('admin fallback attendance creates ADMIN_MARKED record', async () => {
    const date = new Date().toISOString().split('T')[0]; // Use today for E2
    const record = await AttendanceService.markAttendance({
      employeeId: employeeId2,
      companyId,
      userId: adminUserId,
      date,
      status: AttendanceStatus.ABSENT,
    });
    expect(record.source).toBe('ADMIN_MARKED');
    expect(record.status).toBe('ABSENT');
  });

  it('employee overriding admin attendance updates source to EMPLOYEE_SELF', async () => {
    const record = await AttendanceService.checkIn(employeeId2, companyId, employeeUserId2, {});
    expect(record.source).toBe('EMPLOYEE_SELF');
    expect(record.submitted_by_user_id).toBe(employeeUserId2);
    expect(record.status).toBe('PRESENT');
  });

  it('admin attempting to overwrite employee attendance (must fail with 409)', async () => {
    // Use new Date().toISOString() so new Date(date) in markAttendance gives exactly today
    const dateStr = new Date().toISOString();
    
    let caughtError: any = null;
    try {
      await AttendanceService.markAttendance({
        employeeId: employeeId2,
        companyId,
        userId: adminUserId,
        date: dateStr,
        status: AttendanceStatus.ABSENT,
      });
    } catch (e) {
      caughtError = e;
    }
    
    expect(caughtError).not.toBeNull();
    expect(caughtError).toBeDefined();
    expect(caughtError.status).toBe(409);
    expect(caughtError.code).toBe('ATTENDANCE_ALREADY_SUBMITTED');
  });

  it('duplicate submissions by employee should fail or ignore (checkIn logic)', async () => {
    let caughtError: any = null;
    try {
      await AttendanceService.checkIn(employeeId1, companyId, employeeUserId1, {});
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Already checked in today');
  });
});
