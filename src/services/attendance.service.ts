import prisma from '../lib/prisma.ts';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceService {
  static async markAttendance(data: {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
  }) {
    const attendanceDate = new Date(data.date);
    attendanceDate.setHours(0, 0, 0, 0);

    return prisma.attendance.upsert({
      where: {
        employee_id_date: {
          employee_id: data.employeeId,
          date: attendanceDate,
        },
      },
      update: {
        status: data.status,
        remarks: data.remarks,
      },
      create: {
        employee_id: data.employeeId,
        date: attendanceDate,
        status: data.status,
        remarks: data.remarks,
      },
    });
  }

  static async getAttendanceReport(companyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const employees = await prisma.employee.findMany({
      where: { 
        company_id: companyId,
        employment_status: { in: ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD'] }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_code: true,
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: { employee_code: 'asc' }
    });

    return employees;
  }

  static async getMonthlySummary(companyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const employees = await prisma.employee.findMany({
      where: { 
        company_id: companyId,
        employment_status: { in: ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD'] }
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        employee_code: true,
        attendance: {
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: { employee_code: 'asc' }
    });

    return employees.map(emp => {
      const counts = {
        PRESENT: 0,
        ABSENT: 0,
        HALF_DAY: 0,
        ON_LEAVE: 0
      };

      emp.attendance.forEach(record => {
        counts[record.status]++;
      });

      return {
        employee_id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        employee_code: emp.employee_code,
        ...counts
      };
    });
  }
}
