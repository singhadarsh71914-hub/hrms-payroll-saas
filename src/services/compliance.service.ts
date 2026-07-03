import prisma from '../lib/prisma.ts';
import { RuleType, TaxRegime } from '@prisma/client';

export class ComplianceService {
  static async loadActiveRules(financialYear: number, payrollDate: Date) {
    const rules = await prisma.stateComplianceRule.findMany({
      where: {
        financial_year: financialYear,
        is_active: true,
        effective_from: { lte: payrollDate },
        effective_to: { gte: payrollDate }
      }
    });

    const taxSlabs = await prisma.taxSlab.findMany({
      where: {
        financial_year: financialYear,
        is_active: true,
        effective_from: { lte: payrollDate },
        effective_to: { gte: payrollDate }
      }
    });

    const bonusRules = await prisma.bonusRule.findMany({
      where: {
        financial_year: financialYear,
        is_active: true,
        effective_from: { lte: payrollDate },
        effective_to: { gte: payrollDate }
      }
    });

    return { rules, taxSlabs, bonusRules };
  }

  static getRule(rules: any[], type: RuleType, state: string) {
    let rule = rules.find(r => r.rule_type === type && r.state_code === state);
    if (!rule) rule = rules.find(r => r.rule_type === type && r.state_code === 'GLOBAL');
    return rule;
  }

  static calculatePT(ptRule: any, grossSalary: number, month: number): number {
    if (!ptRule || !ptRule.configuration || !ptRule.configuration.slabs) return 0;
    const slabs = ptRule.configuration.slabs;
    let pt = 0;
    for (const slab of slabs) {
      if (grossSalary >= slab.min && (slab.max === null || grossSalary <= slab.max)) {
        pt = slab.amount;
        if (month === 2 && slab.feb_amount) pt = slab.feb_amount;
        break;
      }
    }
    return pt;
  }

  static calculateESI(esiRule: any, grossSalary: number): { employee: number, employer: number } {
    if (!esiRule || !esiRule.configuration) return { employee: 0, employer: 0 };
    const config = esiRule.configuration;
    if (grossSalary <= config.salary_threshold) {
      return {
        employee: Math.ceil(grossSalary * (config.employee_rate / 100)),
        employer: Math.ceil(grossSalary * (config.employer_rate / 100))
      };
    }
    return { employee: 0, employer: 0 };
  }

  static calculateLWF(lwfRule: any, month: number): { employee: number, employer: number } {
    if (!lwfRule || !lwfRule.configuration) return { employee: 0, employer: 0 };
    const config = lwfRule.configuration;
    if (config.months && config.months.includes(month)) {
      return {
        employee: config.employee_amount,
        employer: config.employer_amount
      };
    }
    return { employee: 0, employer: 0 };
  }

  static calculateTDS(slabs: any[], regime: TaxRegime, annualGross: number): number {
    const applicableSlabs = slabs.filter(s => s.regime === regime);
    if (applicableSlabs.length === 0) return 0;
    
    // Check rebate
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, annualGross - standardDeduction);
    
    const rebateRule = applicableSlabs[0].rebate_rules;
    if (rebateRule && taxableIncome <= rebateRule.max_income_for_rebate) {
      return 0;
    }

    // Sort slabs by min_income
    applicableSlabs.sort((a, b) => Number(a.min_income) - Number(b.min_income));
    
    let tax = 0;
    for (const slab of applicableSlabs) {
      const min = Number(slab.min_income);
      const max = slab.max_income !== null ? Number(slab.max_income) : Infinity;
      const rate = Number(slab.rate) / 100;
      
      if (taxableIncome > min) {
        const taxableAmountInSlab = Math.min(taxableIncome, max) - min;
        tax += taxableAmountInSlab * rate;
      }
    }
    
    const cess = applicableSlabs[0].cess_percent ? Number(applicableSlabs[0].cess_percent) / 100 : 0.04;
    return Math.max(0, tax * (1 + cess));
  }
}
