// @ts-nocheck
import prisma from '../lib/prisma.ts';

export class CompensationService {
  static async getPercentiles(companyId: string) {
    const employees = await prisma.employeeSalary.findMany({
      where: { salary_structure: { company_id: companyId } },
      select: { gross_salary: true },
    });

    const salaries = employees.map(e => Number(e.gross_salary)).filter(s => !isNaN(s) && s > 0).sort((a, b) => a - b);
    if (salaries.length === 0) return { P10: 0, P25: 0, P50: 0, P75: 0, P90: 0 };

    const getPercentile = (p: number) => {
      const index = Math.floor(salaries.length * p) - 1;
      return salaries[Math.max(0, index)];
    };

    return {
      P10: getPercentile(0.10),
      P25: getPercentile(0.25),
      P50: getPercentile(0.50),
      P75: getPercentile(0.75),
      P90: getPercentile(0.90)
    };
  }
}
