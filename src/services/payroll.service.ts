import prisma from '../lib/prisma.ts';
import path from 'path';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { sendEmail } from '../lib/email.ts';
import { NotificationService } from './notification.service.ts';
import { SalarySeedService } from './salary-seed.service.ts';
import { FormulaEngine, PayrollFormulaContext } from './formula.service.ts';
import { ComplianceService } from './compliance.service.ts';
import { TaxRegime, RuleType } from '@prisma/client';

const { Decimal } = Prisma;

/**
 * Resolves the monetary amount for a salary structure component.
 *
 * SalaryStructureComponent stores `value` (number) and `calculation_type`,
 * NOT a pre-computed `amount`. This helper converts them to a rupee amount.
 *
 * @param calcType   - PERCENTAGE_OF_CTC | PERCENTAGE_OF_BASIC | FLAT_AMOUNT
 * @param value      - The percentage or flat number stored in the DB
 * @param ctcMonthly - Employee's monthly CTC (for % of CTC calculations)
 * @param basicAmt   - Already-resolved Basic Pay amount (for % of Basic)
 */
function resolveComponentAmount(
  calcType: string,
  value: number,
  ctcMonthly: number,
  basicAmt: number,
  totalOtherEarnings: number = 0,
  grossAmt: number = 0,
  formulaStr: string | null = null,
  formulaContext: Record<string, number> = {}
): number {
  switch (calcType) {
    case 'PERCENTAGE_OF_CTC':   return Math.round((ctcMonthly * value) / 100);
    case 'PERCENTAGE_OF_BASIC': return Math.round((basicAmt  * value) / 100);
    case 'PERCENTAGE_OF_GROSS': return Math.round((grossAmt  * value) / 100);
    case 'REMAINDER_OF_CTC':    return Math.max(0, ctcMonthly - totalOtherEarnings);
    case 'FLAT_AMOUNT':         return value;
    case 'FORMULA':
      if (formulaStr) return Math.round(FormulaEngine.evaluate(formulaStr, formulaContext));
      return 0;
    default:                    return 0;
  }
}

import { Attendance, PerformanceReview, EmployeeBonus } from '@prisma/client';

export interface SalesRecord {
  amount: number | import('@prisma/client').Prisma.Decimal;
  status: string;
}

export interface PayrollPreloadedData {
  attendanceByEmployee: Record<string, Attendance[]>;
  performanceByEmployee: Record<string, PerformanceReview>;
  bonusesByEmployee: Record<string, EmployeeBonus[]>;
  salesByEmployee: Record<string, SalesRecord[]>;
}

export class PayrollService {
  static buildFormulaContext(
    employeeId: string,
    payrollMonth: number,
    payrollYear: number,
    preloadedData: PayrollPreloadedData
  ): Readonly<PayrollFormulaContext> {
    if (!preloadedData) {
      throw new Error("PayrollPreloadedData missing");
    }
    if (!preloadedData.attendanceByEmployee) {
      throw new Error("PayrollPreloadedData missing: attendanceByEmployee");
    }
    if (!preloadedData.performanceByEmployee) {
      throw new Error("PayrollPreloadedData missing: performanceByEmployee");
    }
    if (!preloadedData.bonusesByEmployee) {
      throw new Error("PayrollPreloadedData missing: bonusesByEmployee");
    }
    if (!preloadedData.salesByEmployee) {
      throw new Error("PayrollPreloadedData missing: salesByEmployee");
    }

    const attendance = preloadedData.attendanceByEmployee[employeeId] || [];
    const performance = preloadedData.performanceByEmployee[employeeId];
    const bonuses = preloadedData.bonusesByEmployee[employeeId] || [];
    const sales = preloadedData.salesByEmployee[employeeId] || [];

    let overtime_hours: number | undefined;
    let sales_amount: number | undefined;
    let bonus_amount = 0;

    for (const b of bonuses) {
      if (b.status !== 'APPROVED') continue;
      
      if (b.type === 'OVERTIME') {
        overtime_hours = (overtime_hours || 0) + Number(b.amount);
      } else if (b.type === 'SALES_COMMISSION') {
        sales_amount = (sales_amount || 0) + Number(b.amount);
      } else {
        bonus_amount += Number(b.amount);
      }
    }

    for (const s of sales) {
      if (s.status !== 'APPROVED') continue;
      sales_amount = (sales_amount || 0) + Number(s.amount);
    }

    let present_days = 0;
    let absent_days = 0;
    for (const a of (attendance || [])) {
      if (a.status === 'PRESENT' || a.status === 'HALF_DAY') present_days++;
      if (a.status === 'ABSENT') absent_days++;
    }
    const working_days = attendance && attendance.length > 0 ? attendance.length : undefined;

    let performance_score: number | undefined;
    if (performance) {
      performance_score = performance.overall_score;
    }

    return Object.freeze({
      overtime_hours,
      sales_amount,
      bonus_amount: bonus_amount > 0 ? bonus_amount : undefined,
      performance_score,
      working_days,
      present_days: working_days ? present_days : undefined,
      absent_days: working_days ? absent_days : undefined
    });
  }

  static getSystemAmount(payslip: any, systemRole: string): number {
    if (!payslip || !payslip.line_items) return 0;
    const item = payslip.line_items.find((i: any) => i.salary_component?.system_role === systemRole);
    return item ? Number(item.amount) : 0;
  }

  static async processPayroll(companyId: string, month: number, year: number) {
    const existingRun = await prisma.payrollRun.findFirst({
      where: { company_id: companyId, month, year }
    });
    if (existingRun) {
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      throw new Error(`Payroll for ${monthNames[month - 1]} ${year} has already been processed. Duplicate runs are not allowed.`);
    }

    // Auto-seed default components if the company's structure has none.
    // This is a one-time idempotent operation guarded inside the service.
    const structure = await prisma.salaryStructure.findFirst({
      where: { company_id: companyId, is_active: true },
      select: { id: true }
    });
    if (structure) {
      await SalarySeedService.seedDefaultComponents(companyId, structure.id);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { state: true }
    });

    const payrollDate = new Date(year, month - 1, 1);
    const financialYear = month <= 3 ? year - 1 : year;
    const complianceContext = await ComplianceService.loadActiveRules(financialYear, payrollDate);

    const employees = await prisma.employee.findMany({
      where: { company_id: companyId, employment_status: 'ACTIVE' },
      include: {
        salaries: {
          where: {
            effective_from: { lte: new Date() },
            OR: [{ effective_to: null }, { effective_to: { gte: new Date() } }]
          },
          include: {
            salary_structure: {
              include: {
                components: {
                  include: { salary_component: true },
                  orderBy: { sequence: 'asc' }
                }
              }
            }
          },
          orderBy: { effective_from: 'desc' },
          take: 1
        }
      }
    });

    const rawStructures = await prisma.salaryStructure.findMany({ where: { company_id: companyId } });
    const structureSnapshot = rawStructures.map(s => ({
      id: s.id,
      name: s.name,
      version: '1',
      effective_from: s.created_at,
      effective_to: null
    }));

    const rawComponents = await prisma.salaryComponent.findMany({ where: { company_id: companyId } });
    const componentSnapshot = rawComponents.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      calculation_type: c.calculation_type,
      value: c.value,
      max_limit: c.max_limit,
      system_role: c.system_role
    }));

    const formulaSnapshot = rawComponents
      .filter(c => c.formula != null || c.calculation_type === 'FORMULA')
      .map(c => ({
        raw_expression: c.formula,
        version: '1',
        component_binding: c.code || c.id
      }));

    if (employees.length === 0) {
      throw new Error(`No active employees found for company ID: ${companyId}. Please ensure employees are added and their status is set to ACTIVE.`);
    }

    const results: any[] = [];
    let totalGrossAll = 0;
    let totalDeductionsAll = 0;
    let totalNetAll = 0;
    let totalEmployerContribAll = 0;
    let totalCompanyCostAll = 0;
    const employeesMissingSalary: string[] = [];
    const employeesFound = employees.length;

    // --- BULK FETCH LOAN DEDUCTIONS (N+1 Optimization) ---
    const employeeIds = employees.map(e => e.id);
    const allActiveEMIs = await prisma.loanRepayment.findMany({
      where: {
        loan: { employee_id: { in: employeeIds }, status: 'ACTIVE' },
        month,
        year,
        status: 'PENDING'
      },
      include: { loan: true }
    });
    
    const emiByEmployee = allActiveEMIs.reduce((acc: any, emi: any) => {
      const empId = emi.loan.employee_id;
      if (!acc[empId]) acc[empId] = [];
      acc[empId].push(emi);
      return acc;
    }, {});

    // --- BULK FETCH ATTENDANCE ---
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const allAttendance = await prisma.attendance.findMany({
      where: {
        employee_id: { in: employeeIds },
        date: { gte: startDate, lte: endDate }
      }
    });
    const attendanceByEmployee = allAttendance.reduce((acc: any, a: any) => {
      if (!acc[a.employee_id]) acc[a.employee_id] = [];
      acc[a.employee_id].push(a);
      return acc;
    }, {});

    // --- BULK FETCH PERFORMANCE REVIEWS ---
    const allPerformance = await prisma.performanceReview.findMany({
      where: {
        employee_id: { in: employeeIds }
      },
      orderBy: { created_at: 'desc' }
    });
    const performanceByEmployee = allPerformance.reduce((acc: any, p: any) => {
      if (!acc[p.employee_id]) acc[p.employee_id] = p; // take first (latest)
      return acc;
    }, {});

    // --- BULK FETCH BONUSES ---
    const effectiveMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const runDateObj = new Date(year, month - 1, 1);
    const allActiveBonuses = await prisma.employeeBonus.findMany({
      where: { company_id: companyId, is_active: true }
    });

    const bonusesByEmployee = allActiveBonuses.reduce((acc: any, b: any) => {
      const empId = b.employee_id;
      let isActiveForMonth = false;
      if (b.category === 'VARIABLE_COMPENSATION') {
        if (b.status === 'APPROVED' && b.effective_month === effectiveMonthStr) {
          isActiveForMonth = true;
        }
      } else {
        if (b.recurring) {
          if (b.start_date && runDateObj >= b.start_date) {
            if (!b.end_date || runDateObj <= b.end_date) {
              isActiveForMonth = true;
            }
          }
        } else {
          if (b.effective_month === effectiveMonthStr) {
            isActiveForMonth = true;
          }
        }
      }
      if (isActiveForMonth) {
        if (!acc[empId]) acc[empId] = [];
        acc[empId].push(b);
      }
      return acc;
    }, {});

    for (const employee of employees) {
      const salary = employee.salaries[0];
      if (!salary) {
        employeesMissingSalary.push(`${employee.first_name} ${employee.last_name} (${employee.employee_code})`);
        continue;
      }

      let grossEarnings = 0;
      let totalEmployerContributions = 0;
      const earningsItems: any[] = [];
      const employerContribItems: any[] = [];
      const bonusItems: any[] = [];
      const ctcMonthly = Number(salary.ctc_monthly);

      // Pre-resolve Basic Pay first — other components (HRA, PF) may reference it
      const basicStructComp = salary.salary_structure?.components.find(
        c => c.salary_component.system_role === 'BASIC'
      );
      const basicResolved = basicStructComp
        ? resolveComponentAmount(basicStructComp.calculation_type, Number(basicStructComp.value), ctcMonthly, 0)
        : 0;

      // Calculate gross earnings by resolving each EARNING component
      let totalOtherEarnings = 0;
      const baseContext = PayrollService.buildFormulaContext(
        employee.id,
        month,
        year,
        {
          attendanceByEmployee,
          performanceByEmployee,
          bonusesByEmployee,
          salesByEmployee: bonusesByEmployee
        }
      );

      const getFormulaContext = (currentGross: number) => {
        const getComp = (role: string) => {
          const found = earningsItems.find(i => i.system_role === role);
          return found ? found.amount : 0;
        };
        return Object.freeze({
          ...baseContext,
          ctc: ctcMonthly,
          gross: currentGross,
          basic: basicResolved,
          hra: getComp('HRA'),
          special: getComp('SPECIAL_ALLOWANCE')
        });
      };

      let remainderComponent: any = null;
      if (salary.salary_structure?.components) {
        salary.salary_structure.components.forEach(c => {
          if (c.salary_component.type === 'EARNING') {
            if (c.calculation_type === 'REMAINDER_OF_CTC') {
              if (remainderComponent) {
                throw new Error("Only one REMAINDER component allowed");
              }
              remainderComponent = c;
            } else {
              const amt = resolveComponentAmount(
                c.calculation_type,
                Number(c.value),
                ctcMonthly,
                basicResolved,
                0,
                0,
                c.salary_component.formula,
                getFormulaContext(grossEarnings)
              );
              grossEarnings += amt;
              totalOtherEarnings += amt;
              earningsItems.push({ name: c.salary_component.name, amount: amt, componentId: c.salary_component.id, system_role: c.salary_component.system_role });
            }
          }
        });

        if (totalOtherEarnings > ctcMonthly) {
          throw new Error("Salary structure exceeds CTC");
        }

        if (remainderComponent) {
          const amt = resolveComponentAmount(
            'REMAINDER_OF_CTC',
            Number(remainderComponent.value),
            ctcMonthly,
            basicResolved,
            totalOtherEarnings,
            grossEarnings,
            null,
            getFormulaContext(grossEarnings)
          );
          grossEarnings += amt;
          earningsItems.push({ name: remainderComponent.salary_component.name, amount: amt, componentId: remainderComponent.salary_component.id, system_role: remainderComponent.salary_component.system_role });
        }
      }

      // Process Bonuses
      const employeeBonuses = bonusesByEmployee[employee.id] || [];
      const variableCompTypesPaid = new Set<string>();
      let hasBonusError = false;

      for (const b of employeeBonuses) {
        if (b.category === 'VARIABLE_COMPENSATION') {
          if (variableCompTypesPaid.has(b.type)) {
            employeesMissingSalary.push(`${employee.first_name} ${employee.last_name} (${employee.employee_code}) - Duplicate variable compensation: ${b.type}`);
            hasBonusError = true;
            break;
          }
          variableCompTypesPaid.add(b.type);
        }
        const amt = Number(b.amount);
        grossEarnings += amt;
        bonusItems.push({
          name: `${b.name} (${b.type})`,
          amount: amt,
          bonusId: b.id
        });
      }

      if (hasBonusError) continue;

      let pf = 0;
      let esi = 0;
      let pt = 0;
      let lwfEmployee = 0;
      let monthlyTDS = 0;
      let esiEmployer = 0;
      let pfEmployer = 0;
      let lwfEmployer = 0;
      let gratuityEmployer = 0;
      
      const state = company?.state || 'GLOBAL';
      const ptRule = ComplianceService.getRule(complianceContext.rules, RuleType.PT, state);
      const esiRule = ComplianceService.getRule(complianceContext.rules, RuleType.ESI, state);
      const lwfRule = ComplianceService.getRule(complianceContext.rules, RuleType.LWF, state);
      const gratuityRule = ComplianceService.getRule(complianceContext.rules, RuleType.GRATUITY, state);

      const esiCalc = ComplianceService.calculateESI(esiRule, grossEarnings);
      const lwfCalc = ComplianceService.calculateLWF(lwfRule, month);

      const deductionItems: any[] = [];

      // Second Pass: Calculate Deductions and Employer Contributions now that Gross is known
      if (salary.salary_structure?.components) {
        salary.salary_structure.components.forEach(c => {
          if (c.salary_component.type === 'DEDUCTION' || c.salary_component.type === 'EMPLOYER_CONTRIBUTION') {
            let amt = resolveComponentAmount(
              c.calculation_type,
              Number(c.value),
              ctcMonthly,
              basicResolved,
              0,
              grossEarnings,
              c.salary_component.formula,
              getFormulaContext(grossEarnings)
            );

            // DB-Driven Overrides
            if (c.salary_component.system_role === 'PT') {
              amt = ComplianceService.calculatePT(ptRule, grossEarnings, month);
            } else if (c.salary_component.system_role === 'ESI_EMPLOYEE') {
              amt = esiCalc.employee;
            } else if (c.salary_component.system_role === 'ESI_EMPLOYER') {
              amt = esiCalc.employer;
            } else if (c.salary_component.system_role === 'LWF_EMPLOYEE') {
              amt = lwfCalc.employee;
            } else if (c.salary_component.system_role === 'LWF_EMPLOYER') {
              amt = lwfCalc.employer;
            } else if (c.salary_component.system_role === 'GRATUITY_EMPLOYER') {
              // Usually calculated yearly but provisioned monthly (4.81% of basic)
              if (gratuityRule && gratuityRule.configuration) {
                const config: any = gratuityRule.configuration;
                amt = Math.round(basicResolved * (config.days_factor / config.working_days) / 12);
              }
            }

            const maxLimit = c.max_limit ? Number(c.max_limit) : Infinity;
            const finalAmt = Math.min(amt, maxLimit);
            if (finalAmt < 0) throw new Error("Component calculation cannot be negative");

            if (c.salary_component.type === 'EMPLOYER_CONTRIBUTION') {
              totalEmployerContributions += finalAmt;
              employerContribItems.push({ name: c.salary_component.name, amount: finalAmt, componentId: c.salary_component.id });
              
              if (c.salary_component.system_role === 'ESI_EMPLOYER') esiEmployer = finalAmt;
              else if (c.salary_component.system_role === 'PF_EMPLOYER') pfEmployer = finalAmt;
              else if (c.salary_component.system_role === 'LWF_EMPLOYER') lwfEmployer = finalAmt;
              else if (c.salary_component.system_role === 'GRATUITY_EMPLOYER') gratuityEmployer = finalAmt;
            } else {
              // DEDUCTION
              if (c.salary_component.system_role === 'PF_EMPLOYEE') pf = finalAmt;
              else if (c.salary_component.system_role === 'ESI_EMPLOYEE') esi = finalAmt;
              else if (c.salary_component.system_role === 'PT') pt = finalAmt;
              else if (c.salary_component.system_role === 'LWF_EMPLOYEE') lwfEmployee = finalAmt;
              else if (c.salary_component.system_role === 'TDS') {
                if (process.env.ENABLE_TDS_ENGINE !== 'true') monthlyTDS = finalAmt;
              }

              // Always push to deductionItems, EXCEPT for TDS if engine is enabled
              if (c.salary_component.system_role !== 'TDS' || process.env.ENABLE_TDS_ENGINE !== 'true') {
                deductionItems.push({ name: c.salary_component.name, amount: finalAmt, componentId: c.salary_component.id });
              }
            }
          }
        });
      }

      // TDS calculation (DB-Driven)
      if (process.env.ENABLE_TDS_ENGINE === 'true') {
        const annualGross = Number(salary.ctc_annual);
        // Default to NEW regime if not explicitly old
        const annualTDS = ComplianceService.calculateTDS(complianceContext.taxSlabs, TaxRegime.NEW, annualGross);
        monthlyTDS = Math.max(0, Math.round(annualTDS / 12));

        const tdsComp = salary.salary_structure?.components.find(c => c.salary_component.system_role === 'TDS');
        if (tdsComp && monthlyTDS > 0) {
          deductionItems.push({ name: tdsComp.salary_component.name, amount: monthlyTDS, componentId: tdsComp.salary_component.id });
        }
      }

      // --- LOAN DEDUCTIONS ---
      const activeEMIs = emiByEmployee[employee.id] || [];

      let totalLoanDeduction = 0;
      const loanDeductionItems: { repaymentId: string; loanId: string; name: string; amount: number }[] = [];

      activeEMIs.forEach((emi: any) => {
        const amount = Number(emi.emi_amount);
        totalLoanDeduction += amount;
        loanDeductionItems.push({
          repaymentId: emi.id,
          loanId: emi.loan_id,
          name: `Loan EMI (${emi.loan.loan_type})`,
          amount
        });
      });

      const totalDeductions = totalLoanDeduction + deductionItems.reduce((acc, d) => acc + d.amount, 0);
      const netSalary = grossEarnings - totalDeductions;
      const totalCompanyCost = grossEarnings + totalEmployerContributions;

      if (salary.ctc_monthly == null)
        throw new Error(`Missing ctc_monthly: ${employee.employee_code}`);

      if (Number.isNaN(Number(salary.ctc_monthly)))
        throw new Error(`Invalid ctc_monthly: ${employee.employee_code}`);

      console.table({
        employee: employee.employee_code,
        ctcAnnual: salary?.ctc_annual,
        ctcMonthly: salary?.ctc_monthly,
        basicPay: basicResolved,
        hra: earningsItems.find(i => i.name === 'House Rent Allowance')?.amount,
        specialAllowance: earningsItems.find(i => i.name === 'Special Allowance')?.amount,
        pf,
        pt,
        tds: monthlyTDS,
        grossEarnings,
        totalDeductions,
        netSalary
      });

      if ([grossEarnings, totalDeductions, netSalary].some(Number.isNaN)) {
        throw new Error(`Invalid payroll math: ${employee.employee_code}`);
      }

      results.push({
        employeeId: employee.id,
        grossEarnings,
        totalDeductions,
        netSalary,
        pf,
        esi,
        pt,
        tds: monthlyTDS,
        loanDeductionItems,
        deductionItems,
        earningsItems,
        employerContribItems,
        bonusItems,
        totalEmployerContributions,
        totalCompanyCost,
        pfEmployer,
        esiEmployer
      });

      totalGrossAll += grossEarnings;
      totalDeductionsAll += totalDeductions;
      totalNetAll += netSalary;
      totalEmployerContribAll += totalEmployerContributions;
      totalCompanyCostAll += totalCompanyCost;
    }

    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          company_id: companyId,
          month,
          year,
          run_date: new Date(),
          status: 'PROCESSED',
          total_employees: results.length,
          skipped_employees: employeesMissingSalary.length,
          total_gross: new Decimal(totalGrossAll),
          total_deductions: new Decimal(totalDeductionsAll),
          total_net: new Decimal(totalNetAll),
          total_employer_contributions: new Decimal(totalEmployerContribAll),
          total_company_cost: new Decimal(totalCompanyCostAll),
          compliance_snapshot: {
            financialYear,
            runDate: payrollDate,
            state: company?.state || 'GLOBAL',
            rules_applied: complianceContext.rules.map(r => ({ type: r.rule_type, version: r.version, id: r.id })),
            tax_slabs_applied: complianceContext.taxSlabs.map(r => ({ regime: r.regime, version: r.version, id: r.id }))
          },
          salary_structure_snapshot: structureSnapshot,
          component_snapshot: componentSnapshot,
          formula_snapshot: formulaSnapshot,
          bonus_snapshot: allActiveBonuses
        }
      });

      for (const res of results) {
        const payslip = await tx.payslip.create({
          data: {
            payroll_run_id: run.id,
            employee_id: res.employeeId,
            month,
            year,
            working_days: 30,
            paid_days: 30,
            lop_days: 0,
            gross_salary: new Decimal(res.grossEarnings),
            total_deductions: new Decimal(res.totalDeductions),
            net_salary: new Decimal(res.netSalary),
            pf_employee: new Decimal(res.pf),
            esi_employee: new Decimal(res.esi),
            tds: new Decimal(res.tds),
            pf_employer: new Decimal(res.pfEmployer),
            esi_employer: new Decimal(res.esiEmployer),
            professional_tax: new Decimal(res.pt),
            total_employer_contributions: new Decimal(res.totalEmployerContributions),
            total_company_cost: new Decimal(res.totalCompanyCost),
            state_code: company?.state || 'GLOBAL',
            financial_year: financialYear,
            tax_regime_used: 'NEW',
            statutory_version: '1',
            salary_structure_version: '1',
            compliance_version: '1',
            formula_version: '1',
            tax_regime_version: '1',
            status: 'FINALIZED',
            line_items: {
              create: [
                ...res.earningsItems.map((e: any) => ({
                  salary_component_id: e.componentId,
                  component_name: e.name,
                  component_type: 'EARNING',
                  amount: new Decimal(e.amount)
                })),
                ...res.bonusItems.map((b: any) => ({
                  salary_component_id: null,
                  component_name: b.name,
                  component_type: 'BONUS',
                  amount: new Decimal(b.amount)
                })),
                ...res.loanDeductionItems.map((l: any) => ({
                  salary_component_id: null, // Virtual ID for loans
                  component_name: l.name,
                  component_type: 'DEDUCTION',
                  amount: new Decimal(l.amount)
                })),
                ...res.deductionItems.map((d: any) => ({
                  salary_component_id: d.componentId,
                  component_name: d.name,
                  component_type: 'DEDUCTION',
                  amount: new Decimal(d.amount)
                })),
                ...res.employerContribItems.map((e: any) => ({
                  salary_component_id: e.componentId,
                  component_name: e.name,
                  component_type: 'EMPLOYER_CONTRIBUTION',
                  amount: new Decimal(e.amount)
                }))
              ]
            }
          }
        });

        // Update loan repayment records
        for (const loanItem of res.loanDeductionItems) {
          await tx.loanRepayment.update({
            where: { id: loanItem.repaymentId },
            data: {
              status: 'DEDUCTED',
              payroll_run_id: run.id
            }
          });

          // Check if loan is fully paid
          const remainingRepayments = await tx.loanRepayment.count({
            where: {
              loan_id: loanItem.loanId,
              status: 'PENDING'
            }
          });

          if (remainingRepayments === 0) {
            await tx.loan.update({
              where: { id: loanItem.loanId },
              data: { status: 'CLOSED' }
            });
          }
        }
      }

      return run;
    });

    // Send emails asynchronously after transaction
    console.log(`Starting background email process for payroll run: ${payrollRun.id}`);
    this.sendPayslipsByEmail(payrollRun.id).catch(err => console.error('Failed to send payslip emails:', err));

    const userEmps = await prisma.employee.findMany({ 
      where: { company_id: companyId, employment_status: 'ACTIVE' }, 
      include: { user: true } 
    });

    const notifications = userEmps.filter(e => e.user).flatMap(e => ([
      {
        user_id: e.user!.id,
        type: 'PAYROLL_PROCESSED',
        title: 'Payroll Processed',
        message: `Payroll for month ${month} year ${year} has been processed.`,
      },
      {
        user_id: e.user!.id,
        type: 'PAYSLIP_GENERATED',
        title: 'Payslip Available',
        message: `Your payslip for ${month}/${year} is now available.`,
      }
    ]));

    if (notifications.length > 0) {
      await NotificationService.createBulkNotifications(companyId, notifications);
    }

    // Return run plus skipped count so the API layer can relay it to the UI
    return { ...payrollRun, skippedCount: employeesMissingSalary.length, skippedEmployees: employeesMissingSalary };
  }

  static async sendPayslipsByEmail(runId: string) {
    console.log(`Fetching payslips for run: ${runId}`);
    const payslips = await prisma.payslip.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: true,
      }
    });

    console.log(`Found ${payslips.length} payslips to process.`);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    for (const payslip of payslips) {
      if (!payslip.employee.work_email) {
        console.warn(`Skipping employee ${payslip.employee.id} - No work email found.`);
        continue;
      }

      console.log(`Processing payslip for ${payslip.employee.work_email}...`);
      try {
        const doc = await this.generatePayslipPDF(runId, payslip.employee_id);
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: any[] = [];
          doc.on('data', (chunk) => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));
          doc.on('error', (err) => reject(err));
        });

        const monthName = months[payslip.month - 1];

        await sendEmail(
          payslip.employee.work_email,
          `Your Payslip for ${monthName} ${payslip.year}`,
          `
            <p>Dear ${payslip.employee.first_name} ${payslip.employee.last_name},</p>
            <p>Please find attached your payslip for <b>${monthName} ${payslip.year}</b>.</p>
            <p><b>Net Salary Summary:</b> ₹${Number(payslip.net_salary).toLocaleString()}</p>
            <p>Regards,<br>HR Team</p>
          `,
          [
            {
              filename: `payslip_${monthName}_${payslip.year}.pdf`,
              content: pdfBuffer
            }
          ]
        );
      } catch (err) {
        console.error(`Failed to process/send email for employee ${payslip.employee_id}:`, err);
      }
    }
  }

  static async getPayrollRuns(companyId: string) {
    return prisma.payrollRun.findMany({
      where: { company_id: companyId },
      orderBy: { run_date: 'desc' }
    });
  }

  static async getPayslipsForRun(runId: string) {
    return prisma.payslip.findMany({
      where: { payroll_run_id: runId },
      include: {
        employee: {
          select: {
            first_name: true,
            last_name: true,
            employee_code: true,
            department: { select: { name: true } },
            designation: { select: { name: true } }
          }
        },
        line_items: { include: { salary_component: true } }
      }
    });
  }

  static async generatePayslipPDF(runId: string, employeeId: string) {
    const payslip = await prisma.payslip.findFirst({
      where: { payroll_run_id: runId, employee_id: employeeId },
      include: {
        employee: { include: { designation: true } },
        payroll_run: {
          include: { company: true }
        },
        line_items: { include: { salary_component: true } }
      }
    });

    if (!payslip) throw new Error('Payslip not found');

    if ([payslip.gross_salary, payslip.total_deductions, payslip.net_salary].map(Number).some(Number.isNaN)) {
      throw new Error(`NaN encountered in Payslip amounts for employee ${employeeId}`);
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Register Fonts
    const fontRegular = path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSans-Regular.ttf');
    const fontBold = path.join(process.cwd(), 'src', 'assets', 'fonts', 'NotoSans-Bold.ttf');
    doc.registerFont('NotoSans', fontRegular);
    doc.registerFont('NotoSans-Bold', fontBold);
    
    // Default font
    doc.font('NotoSans');

    const company = payslip.payroll_run.company;
    const employee = payslip.employee;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    // Header
    doc.fontSize(20).text(company.name, { align: 'center' });
    const addressLines = [company.address, company.city, company.state, company.pincode].filter(v => v?.trim());
    if (addressLines.length > 0) {
      doc.fontSize(10).text(addressLines.join(', '), { align: 'center' });
    }
    doc.moveDown();
    doc.fontSize(14).text(`Payslip for ${months[payslip.month - 1]} ${payslip.year}`, { align: 'center', underline: true });
    doc.moveDown();

    // Employee Details
    doc.fontSize(10);
    const leftCol = 50;
    const rightCol = 300;
    let top = doc.y;

    doc.text(`Employee Name: ${employee.first_name} ${employee.last_name}`, leftCol, top);
    doc.text(`Employee ID: ${employee.employee_code}`, leftCol, top + 15);
    doc.text(`Designation: ${employee.designation?.name || 'Not Provided'}`, leftCol, top + 30);

    doc.text(`Bank Name: ${employee.bank_name || 'Not Provided'}`, rightCol, top);
    doc.text(`Account No: ${employee.bank_account_number || 'Not Provided'}`, rightCol, top + 15);
    doc.text(`PAN: ${employee.pan_number || 'Not Provided'}`, rightCol, top + 30);

    doc.moveDown(4);
    
    // Table Headers
    top = doc.y;
    doc.rect(50, top, 500, 20).fill('#f3f4f6').stroke('#000');
    doc.fillColor('#000').text('EARNINGS', 60, top + 5, { width: 140 });
    doc.text('AMOUNT', 200, top + 5, { width: 90, align: 'right' });
    doc.text('DEDUCTIONS', 310, top + 5, { width: 140 });
    doc.text('AMOUNT', 450, top + 5, { width: 90, align: 'right' });
    
    doc.moveDown();
    top = doc.y + 5;

    // Line Items (Earnings)
    let currentY = top;
    payslip.line_items.filter(i => i.component_type === 'EARNING').forEach((item) => {
      doc.text(item.component_name, 60, currentY, { width: 140 });
      doc.text(Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 200, currentY, { width: 90, align: 'right' });
      currentY += 15;
    });

    // Deductions
    let deductY = top;
    const deductions = [
      { name: 'Provident Fund (PF)', amount: PayrollService.getSystemAmount(payslip, 'PF_EMPLOYEE') },
      { name: 'ESIC', amount: PayrollService.getSystemAmount(payslip, 'ESI_EMPLOYEE') },
      { name: 'Professional Tax (PT)', amount: PayrollService.getSystemAmount(payslip, 'PT') },
      { name: 'Income Tax (TDS)', amount: PayrollService.getSystemAmount(payslip, 'TDS') },
      ...payslip.line_items.filter(i => 
        i.component_type === 'DEDUCTION' && 
        !['PF_EMPLOYEE', 'ESI_EMPLOYEE', 'PT', 'TDS'].includes(i.salary_component?.system_role || '')
      ).map(i => ({ name: i.component_name, amount: i.amount }))
    ];

    deductions.forEach((d) => {
      if (Number(d.amount) > 0) {
        doc.text(d.name, 310, deductY, { width: 140 });
        doc.text(Number(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, deductY, { width: 90, align: 'right' });
        deductY += 15;
      }
    });

    const tableBottom = Math.max(currentY, deductY) + 10;
    doc.moveTo(50, top - 5).lineTo(50, tableBottom).stroke();
    doc.moveTo(300, top - 5).lineTo(300, tableBottom).stroke();
    doc.moveTo(550, top - 5).lineTo(550, tableBottom).stroke();
    doc.moveTo(50, tableBottom).lineTo(550, tableBottom).stroke();

    // Fix overlap: correctly advance doc.y past the manually drawn table bottom
    doc.y = tableBottom + 10;

    // Totals
    const totalsY = doc.y;
    
    // Debug font before printing rupee symbol
    console.log(`Current doc font before Rupee symbol: ${(doc as any)._font?.name}`);

    doc.text(`Gross Earnings: `, 60, totalsY);
    doc.text(`₹${Number(payslip.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, totalsY, { width: 90, align: 'right' });
    
    doc.text(`Total Deductions: `, 310, totalsY);
    doc.text(`₹${Number(payslip.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalsY, { width: 90, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12).font('NotoSans-Bold');
    doc.rect(50, doc.y, 500, 30).fill('#e5e7eb').stroke('#000');
    doc.fillColor('#000').text(`NET SALARY: ₹${Number(payslip.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 60, doc.y + 10, { width: 400, align: 'center' });

    doc.moveDown(4);
    
    // BONUSES & INCENTIVES (Split into Fixed and Variable)
    const allBonusItems = payslip.line_items.filter(i => i.component_type === 'BONUS');
    const isVariable = (name: string) => name.includes('(SALES_COMMISSION)') || name.includes('(OVERTIME)') || name.includes('(PERFORMANCE)');
    const fixedBonuses = allBonusItems.filter(b => !isVariable(b.component_name));
    const variableComps = allBonusItems.filter(b => isVariable(b.component_name));

    if (fixedBonuses.length > 0) {
      doc.fontSize(10).font('NotoSans-Bold').text('BONUSES', 50, doc.y);
      doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('NotoSans');
      
      let bY = doc.y;
      fixedBonuses.forEach((b) => {
        if (Number(b.amount) > 0) {
          // Remove the type suffix for PDF rendering
          const displayName = b.component_name.replace(/ \([^)]+\)$/, '');
          doc.text(displayName, 50, bY, { width: 140 });
          doc.text(`₹${Number(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, bY, { width: 90, align: 'right' });
          bY += 15;
        }
      });
      doc.y = bY;
      doc.moveDown(2);
    }

    if (variableComps.length > 0) {
      doc.fontSize(10).font('NotoSans-Bold').text('VARIABLE COMPENSATION', 50, doc.y);
      doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('NotoSans');
      
      let bY = doc.y;
      variableComps.forEach((b) => {
        if (Number(b.amount) > 0) {
          // Remove the type suffix for PDF rendering
          const displayName = b.component_name.replace(/ \([^)]+\)$/, '');
          doc.text(displayName, 50, bY, { width: 140 });
          doc.text(`₹${Number(b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, bY, { width: 90, align: 'right' });
          bY += 15;
        }
      });
      doc.y = bY;
      doc.moveDown(2);
    }

    // EMPLOYER CONTRIBUTIONS
    const employerContribs = payslip.line_items.filter(i => i.component_type === 'EMPLOYER_CONTRIBUTION');
    if (employerContribs.length > 0) {
      doc.fontSize(10).font('NotoSans-Bold').text('EMPLOYER CONTRIBUTIONS', 50, doc.y);
      doc.moveTo(50, doc.y).lineTo(200, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('NotoSans');
      
      let ecY = doc.y;
      employerContribs.forEach((ec) => {
        if (Number(ec.amount) > 0) {
          doc.text(ec.component_name, 50, ecY, { width: 140 });
          doc.text(`₹${Number(ec.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, ecY, { width: 90, align: 'right' });
          ecY += 15;
        }
      });
      doc.y = ecY;
      doc.moveDown();
      
      doc.font('NotoSans-Bold');
      doc.text(`TOTAL COMPANY COST:`, 50, doc.y);
      doc.text(`₹${Number(payslip.total_company_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, doc.y - 14, { width: 90, align: 'right' });
      doc.moveDown(2);
    }

    doc.fontSize(10).font('NotoSans').text('This is a computer generated document and does not require a signature.', { align: 'center' });

    doc.end();
    return doc;
  }
}
