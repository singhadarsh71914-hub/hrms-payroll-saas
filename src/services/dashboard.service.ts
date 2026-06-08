import prisma from '../lib/prisma.ts';

export class DashboardService {
  static async getStats(companyId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [
      employeeCount,
      pendingLeaves,
      currentMonthPayroll,
      recentRuns,
      recentLeaves
    ] = await Promise.all([
      // Total active employees
      prisma.employee.count({
        where: { company_id: companyId, employment_status: 'ACTIVE', is_active: true }
      }),
      // Pending leave requests
      prisma.leaveRequest.count({
        where: { 
          employee: { company_id: companyId },
          status: 'PENDING'
        }
      }),
      // This month's payroll amount
      prisma.payrollRun.aggregate({
        where: { company_id: companyId, month: currentMonth, year: currentYear },
        _sum: { total_net: true }
      }),
      // Recent payroll runs (last 3)
      prisma.payrollRun.findMany({
        where: { company_id: companyId },
        orderBy: { run_date: 'desc' },
        take: 3
      }),
      // Recent leave requests (last 3)
      prisma.leaveRequest.findMany({
        where: { employee: { company_id: companyId } },
        include: { 
          employee: { 
            select: { first_name: true, last_name: true } 
          } 
        },
        orderBy: { start_date: 'desc' },
        take: 3
      })
    ]);

    return {
      totalEmployees: employeeCount,
      pendingLeaveRequests: pendingLeaves,
      monthlyPayrollAmount: currentMonthPayroll._sum.total_net || 0,
      recentPayrollRuns: recentRuns,
      recentLeaveRequests: recentLeaves
    };
  }
}
