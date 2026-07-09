import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';
import { SalarySeedService } from './salary-seed.service.ts';

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

    // Bug fix #1: Use UTC midnight to avoid timezone off-by-one.
    // setHours(0,0,0,0) uses local (IST) time → stores as UTC 18:30 prev day.
    // setUTCHours ensures we always store the intended calendar date at 00:00 UTC.
    const effectiveFromDate = new Date(data.effectiveFrom);
    effectiveFromDate.setUTCHours(0, 0, 0, 0);

    let salaryStructureId = currentSalary?.salary_structure_id;
    if (!salaryStructureId) {
      let defaultStructure = await prisma.salaryStructure.findFirst();
      if (!defaultStructure) {
        // Create a default structure if none exists
        await SalarySeedService.bootstrapTenant(employee.company_id);
        defaultStructure = await prisma.salaryStructure.findFirst({
          where: { company_id: employee.company_id }
        });
        if (!defaultStructure) {
           throw new Error("Failed to bootstrap default structure");
        }
      }
      salaryStructureId = defaultStructure.id;
    }

    return prisma.$transaction(async (tx) => {
      // Bug fix #2: Use <= instead of < so we also close the previous record
      // when it has the same effective_from date (same-day revision).
      // This prevents two records with effective_to=null from coexisting.
      if (currentSalary && currentSalary.effective_from <= effectiveFromDate) {
        await tx.employeeSalary.update({
          where: { id: currentSalary.id },
          data: {
            effective_to: new Date(effectiveFromDate.getTime() - 1)
          }
        });
      }

      // Create new salary record — this becomes the active salary for payroll
      return tx.employeeSalary.create({
        data: {
          employee_id: data.employeeId,
          salary_structure_id: salaryStructureId,
          effective_from: effectiveFromDate,
          ctc_annual: new Decimal(data.ctcAnnual),
          ctc_monthly: new Decimal(Math.round(data.ctcAnnual / 12)),
          revision_reason: data.reason,
          created_by: data.createdBy
        }
      });
    });
  }
}
