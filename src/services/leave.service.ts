import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';
import { NotificationService } from './notification.service.ts';

const { Decimal } = Prisma;

export class LeaveService {
  static async initializeBalances(employeeId: string, year: number) {
    const balances = [
      { type: 'CASUAL', days: 12 },
      { type: 'SICK', days: 12 },
      { type: 'ANNUAL', days: 15 },
    ];

    for (const b of balances) {
      await prisma.leaveBalance.upsert({
        where: {
          employee_id_leave_type_year: {
            employee_id: employeeId,
            leave_type: b.type,
            year,
          },
        },
        update: {},
        create: {
          employee_id: employeeId,
          leave_type: b.type,
          total_days: new Decimal(b.days),
          balance_days: new Decimal(b.days),
          year,
        },
      });
    }
  }

  static async getLeaveBalances(employeeId: string, year: number) {
    // Auto-initialize if not exists
    const existing = await prisma.leaveBalance.findMany({
      where: { employee_id: employeeId, year }
    });

    if (existing.length === 0) {
      await this.initializeBalances(employeeId, year);
      return prisma.leaveBalance.findMany({
        where: { employee_id: employeeId, year }
      });
    }

    return existing;
  }

  static async applyLeave(employeeId: string, data: { leaveType: string, startDate: string, endDate: string, reason?: string }) {
    try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const year = start.getFullYear();
    const balances = await this.getLeaveBalances(employeeId, year);
    const balance = balances.find(b => b.leave_type === data.leaveType);

    if (!balance) throw new Error('Invalid leave type');
    if (Number(balance.balance_days) < diffDays) {
      throw new Error(`Insufficient leave balance. Requested: ${diffDays}, Available: ${balance.balance_days}`);
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employee_id: employeeId,
        leave_type: data.leaveType,
        start_date: start,
        end_date: end,
        total_days: new Decimal(diffDays),
        reason: data.reason,
        status: 'PENDING'
      }
    });

    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, include: { company: true } });
    if (emp) {
      if (emp.reporting_manager_id) {
        const manager = await prisma.employee.findUnique({ where: { id: emp.reporting_manager_id } });
        if (manager && manager.user_id) {
          await NotificationService.createNotification({
            company_id: emp.company_id,
            user_id: manager.user_id,
            type: 'LEAVE_APPLIED',
            title: 'New Leave Request',
            message: `${emp.first_name} ${emp.last_name} applied for ${diffDays} days of ${data.leaveType} leave.`,
          });
        }
      }
      const hrUsers = await prisma.user.findMany({
        where: { company_id: emp.company_id, role: { in: ['HR', 'ADMIN'] } }
      });
      if (hrUsers.length > 0) {
        await NotificationService.createBulkNotifications(
          emp.company_id,
          hrUsers.map(hr => ({
            user_id: hr.id,
            type: 'LEAVE_APPLIED',
            title: 'New Leave Request',
            message: `${emp.first_name} ${emp.last_name} applied for leave.`,
          }))
        );
      }
    }
    return request;
  } catch (error) {
      console.error('APPLY_LEAVE_ERROR:', error);
      throw error;
    }
  }

  static async getLeaveRequests(companyId: string, employeeId?: string) {
    const where: any = {};
    if (employeeId) {
      where.employee_id = employeeId;
    } else {
      where.employee = { company_id: companyId };
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true
          }
        }
      },
      orderBy: { start_date: 'desc' }
    });
  }

  static async updateLeaveStatus(requestId: string, status: 'APPROVED' | 'REJECTED', approvedBy: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (!request) throw new Error('Leave request not found');
    if (request.status !== 'PENDING') throw new Error('Request already processed');

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status,
          approved_by: approvedBy,
          approved_at: new Date()
        }
      });

      if (status === 'APPROVED') {
        const year = request.start_date.getFullYear();
        const balance = await tx.leaveBalance.findUnique({
          where: {
            employee_id_leave_type_year: {
              employee_id: request.employee_id,
              leave_type: request.leave_type,
              year
            }
          }
        });

        if (balance) {
          await tx.leaveBalance.update({
            where: { id: balance.id },
            data: {
              used_days: { increment: request.total_days },
              balance_days: { decrement: request.total_days }
            }
          });
        }
      }

      return updatedRequest;
    });

    const requestAfter = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true }
    });

    if (requestAfter && requestAfter.employee && requestAfter.employee.user_id) {
      await NotificationService.createNotification({
        company_id: requestAfter.employee.company_id,
        user_id: requestAfter.employee.user_id,
        type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
        title: status === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
        message: `Your ${requestAfter.leave_type} leave request has been ${status.toLowerCase()}.`,
      });
    }

    return requestAfter;
  }
}
