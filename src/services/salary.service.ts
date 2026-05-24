import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

export class SalaryService {
  static async getRevisionHistory(employeeId: string) {
    return prisma.employeeSalary.findMany({
      where: { employee_id: employeeId },
      include: {
        salary_structure: true
      },
      orderBy: { effective_from: 'desc' }
    });
  }

  static async reviseSalary(data: {
    employeeId: string;
    ctcAnnual: number;
    effectiveFrom: string;
    reason: string;
    createdBy: string;
  }) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: {
        salaries: {
          orderBy: { effective_from: 'desc' },
          take: 1
        }
      }
    });

    if (!employee) throw new Error('Employee not found');
    const currentSalary = employee.salaries[0];
    
    if (!currentSalary) throw new Error('No current salary found to revise');

    const effectiveFromDate = new Date(data.effectiveFrom);
    effectiveFromDate.setHours(0, 0, 0, 0);

    return prisma.$transaction(async (tx) => {
      // 1. Update previous salary's effective_to if it exists and is before new effective_from
      if (currentSalary.effective_from < effectiveFromDate) {
        await tx.employeeSalary.update({
          where: { id: currentSalary.id },
          data: {
            effective_to: new Date(effectiveFromDate.getTime() - 1)
          }
        });
      }

      // 2. Create new salary record
      return tx.employeeSalary.create({
        data: {
          employee_id: data.employeeId,
          salary_structure_id: currentSalary.salary_structure_id,
          effective_from: effectiveFromDate,
          ctc_annual: new Decimal(data.ctcAnnual),
          ctc_monthly: new Decimal(data.ctcAnnual / 12),
          revision_reason: data.reason,
          created_by: data.createdBy
        }
      });
    });
  }
}
