import prisma from '../lib/prisma.ts';
import { Prisma, LoanType, LoanStatus } from '@prisma/client';
import { NotificationService } from './notification.service.ts';

const { Decimal } = Prisma;

export class LoanService {
  static async applyLoan(employeeId: string, data: {
    loanType: LoanType;
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    startDate: string;
    reason?: string;
  }) {
    // EMI Calculation: [P x R x (1+R)^N]/[(1+R)^N-1]
    const P = data.principalAmount;
    const r = (data.interestRate / 100) / 12; // monthly interest rate
    const N = data.tenureMonths;
    
    let emi = 0;
    if (r === 0) {
      emi = P / N;
    } else {
      emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    }

    return prisma.loan.create({
      data: {
        employee_id: employeeId,
        loan_type: data.loanType,
        principal_amount: new Decimal(P),
        interest_rate: new Decimal(data.interestRate),
        tenure_months: N,
        emi_amount: new Decimal(emi),
        start_date: new Date(data.startDate),
        reason: data.reason,
        status: 'PENDING'
      }
    });
  }

  static async approveLoan(loanId: string, approvedBy: string) {
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { repayments: true }
    });

    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'PENDING') throw new Error('Loan already processed');

    const result = await prisma.$transaction(async (tx) => {
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: 'ACTIVE',
          approved_by: approvedBy,
          approval_date: new Date(),
        }
      });

      // Generate Repayment Schedule
      const P = Number(loan.principal_amount);
      const r = (Number(loan.interest_rate) / 100) / 12;
      const N = loan.tenure_months;
      const EMI = Number(loan.emi_amount);

      let balance = P;
      const startDate = new Date(loan.start_date);

      for (let i = 1; i <= N; i++) {
        const interest = balance * r;
        const principal = EMI - interest;
        balance -= principal;

        const currentMonth = new Date(startDate);
        currentMonth.setMonth(startDate.getMonth() + i - 1);

        await tx.loanRepayment.create({
          data: {
            loan_id: loanId,
            month: currentMonth.getMonth() + 1,
            year: currentMonth.getFullYear(),
            emi_amount: new Decimal(EMI),
            principal_component: new Decimal(principal),
            interest_component: new Decimal(interest),
            balance_remaining: new Decimal(Math.max(0, balance)),
            status: 'PENDING'
          }
        });
      }

      return updatedLoan;
    });

    const empUser = await prisma.employee.findUnique({ where: { id: loan.employee_id }, include: { user: true } });
    if (empUser && empUser.user) {
        await NotificationService.createNotification({
            company_id: empUser.company_id,
            user_id: empUser.user.id,
            type: 'LOAN_APPROVED',
            title: 'Loan Approved',
            message: `Your loan request for ₹${loan.principal_amount} has been approved.`,
        });
    }

    return result;
  }

  static async rejectLoan(loanId: string, approvedBy: string, remarks?: string) {
    const loan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'REJECTED',
        approved_by: approvedBy,
        approval_date: new Date(),
        remarks
      }
    });

    const empUser = await prisma.employee.findUnique({ where: { id: loan.employee_id }, include: { user: true } });
    if (empUser && empUser.user) {
        await NotificationService.createNotification({
            company_id: empUser.company_id,
            user_id: empUser.user.id,
            type: 'LOAN_REJECTED',
            title: 'Loan Rejected',
            message: `Your loan request for ₹${loan.principal_amount} has been rejected.`,
        });
    }

    return loan;
  }

  static async getLoanById(loanId: string) {
    return prisma.loan.findUnique({
      where: { id: loanId },
      include: { 
        employee: true,
        repayments: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }]
        }
      }
    });
  }

  static async getAllLoans(companyId: string, filters?: any) {
    const where: any = {
      employee: { company_id: companyId }
    };

    if (filters?.status) where.status = filters.status;
    if (filters?.employeeId) where.employee_id = filters.employeeId;
    if (filters?.loanType) where.loan_type = filters.loanType;

    return prisma.loan.findMany({
      where,
      include: { employee: true },
      orderBy: { created_at: 'desc' }
    });
  }

  static async getEmployeeLoans(employeeId: string) {
    return prisma.loan.findMany({
      where: { employee_id: employeeId },
      include: { repayments: true },
      orderBy: { created_at: 'desc' }
    });
  }

  static async getLoansDashboardStats(companyId: string) {
    const activeLoans = await prisma.loan.findMany({
      where: { 
        employee: { company_id: companyId },
        status: 'ACTIVE'
      },
      include: { repayments: true }
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyEMI = await prisma.loanRepayment.aggregate({
      where: {
        loan: { employee: { company_id: companyId } },
        month: currentMonth,
        year: currentYear,
        status: 'DEDUCTED'
      },
      _sum: { emi_amount: true }
    });

    const pendingCount = await prisma.loan.count({
      where: {
        employee: { company_id: companyId },
        status: 'PENDING'
      }
    });

    let totalOutstanding = 0;
    activeLoans.forEach(loan => {
      const lastRepayment = loan.repayments
        .filter(r => r.status === 'DEDUCTED')
        .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
      
      totalOutstanding += lastRepayment ? Number(lastRepayment.balance_remaining) : Number(loan.principal_amount);
    });

    return {
      totalOutstanding,
      activeLoansCount: activeLoans.length,
      thisMonthEMICollection: monthlyEMI._sum.emi_amount || 0,
      pendingApprovalCount: pendingCount
    };
  }
}
