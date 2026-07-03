import prisma from '../lib/prisma.ts';

export class AttendanceRepository {
  static async findByDateAndCompany(date: Date, companyId: string) {
    return prisma.attendance.findMany({
      where: { employee: { company_id: companyId }, date },
      include: { employee: true }
    });
  }

  static async findSinceDateAndCompany(startDate: Date, companyId: string) {
    return prisma.attendance.findMany({
      where: { employee: { company_id: companyId }, date: { gte: startDate } }
    });
  }

  static async countActiveEmployees(companyId: string) {
    return prisma.employee.count({
      where: { company_id: companyId, is_active: true }
    });
  }

  static async getEmployeeHolidaysOrLeaves(companyId: string, targetDate: Date) {
    return prisma.leaveRequest.count({
      where: { employee: { company_id: companyId }, start_date: { lte: targetDate }, end_date: { gte: targetDate }, status: 'APPROVED' }
    });
  }
}
