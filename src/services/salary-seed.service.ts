import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

const DEFAULT_COMPONENTS = [
  { code: 'BASIC',    name: 'Basic Pay',             type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'PERCENTAGE_OF_CTC'  as const, value: 40, maxLimit: null, sequence: 1, isTaxable: true,  isStatutory: false, systemRole: 'BASIC' as const },
  { code: 'HRA',      name: 'House Rent Allowance',  type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'PERCENTAGE_OF_CTC'  as const, value: 20, maxLimit: null, sequence: 2, isTaxable: false, isStatutory: false, systemRole: 'HRA' as const },
  { code: 'SPECIAL',  name: 'Special Allowance',     type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'REMAINDER_OF_CTC'   as const, value: 0,  maxLimit: null, sequence: 3, isTaxable: true,  isStatutory: false, systemRole: 'SPECIAL_ALLOWANCE' as const },
  { code: 'PF',       name: 'Provident Fund',        type: 'DEDUCTION' as const, category: 'STATUTORY' as const, calcType: 'PERCENTAGE_OF_BASIC' as const, value: 12, maxLimit: 1800, sequence: 4, isTaxable: false, isStatutory: true,  systemRole: 'PF_EMPLOYEE' as const },
  { code: 'ESI',      name: 'Employee State Ins.',   type: 'DEDUCTION' as const, category: 'STATUTORY' as const, calcType: 'PERCENTAGE_OF_GROSS' as const, value: 0.75, maxLimit: null, sequence: 5, isTaxable: false, isStatutory: true, systemRole: 'ESI_EMPLOYEE' as const },
  { code: 'PT',       name: 'Professional Tax',      type: 'DEDUCTION' as const, category: 'STATUTORY' as const, calcType: 'FLAT_AMOUNT'          as const, value: 200, maxLimit: null, sequence: 6, isTaxable: false, isStatutory: true,  systemRole: 'PT' as const },
  { code: 'BONUS',    name: 'Bonus',                 type: 'EARNING'   as const, category: 'VARIABLE'  as const, calcType: 'FLAT_AMOUNT'          as const, value: 0,   maxLimit: null, sequence: 7, isTaxable: true,  isStatutory: false, systemRole: null },
  { code: 'GRATUITY', name: 'Gratuity',              type: 'EMPLOYER_CONTRIBUTION' as const, category: 'STATUTORY' as const, calcType: 'PERCENTAGE_OF_BASIC' as const, value: 4.81, maxLimit: null, sequence: 8, isTaxable: false, isStatutory: true, systemRole: 'GRATUITY_EMPLOYER' as const },
];

export class SalarySeedService {
  static async bootstrapTenant(companyId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const componentIds: Record<string, string> = {};

      for (const def of DEFAULT_COMPONENTS) {
        const comp = await tx.salaryComponent.upsert({
          where: { company_id_code: { company_id: companyId, code: def.code } },
          update: { name: def.name, is_active: true, system_role: def.systemRole },
          create: {
            company_id:   companyId,
            code:         def.code,
            name:         def.name,
            type:         def.type,
            category:     def.category,
            is_taxable:   def.isTaxable,
            is_statutory: def.isStatutory,
            is_active:    true,
            system_role:  def.systemRole,
          },
        });
        componentIds[def.code] = comp.id;
      }

      let structure = await tx.salaryStructure.findFirst({
        where: { company_id: companyId, name: 'Standard Structure' }
      });

      if (!structure) {
        structure = await tx.salaryStructure.create({
          data: {
            company_id: companyId,
            name: 'Standard Structure',
            description: 'Default standardized salary structure',
            is_active: true
          }
        });

        for (const def of DEFAULT_COMPONENTS) {
          await tx.salaryStructureComponent.create({
            data: {
              salary_structure_id: structure.id,
              salary_component_id: componentIds[def.code],
              calculation_type:    def.calcType,
              value:               new Decimal(def.value),
              max_limit:           def.maxLimit ? new Decimal(def.maxLimit) : null,
              sequence:            def.sequence,
            },
          });
        }
      }

      const fyYear = 2026;
      const effectiveFrom = new Date(`${fyYear}-04-01`);
      const effectiveTo = new Date(`${fyYear + 1}-03-31`);
      
      const ptRuleExists = await tx.stateComplianceRule.findFirst({ where: { company_id: companyId, rule_type: 'PT', financial_year: fyYear }});
      if (!ptRuleExists) {
        await tx.stateComplianceRule.create({
          data: {
            company_id: companyId, state_code: 'GLOBAL', rule_type: 'PT', financial_year: fyYear, version: 1,
            is_active: true, configuration: { amount: 200 }, effective_from: effectiveFrom, effective_to: effectiveTo
          }
        });
      }


      const esiRuleExists = await tx.stateComplianceRule.findFirst({ where: { company_id: companyId, rule_type: 'ESI', financial_year: fyYear }});
      if (!esiRuleExists) {
        await tx.stateComplianceRule.create({
          data: {
            company_id: companyId, state_code: 'GLOBAL', rule_type: 'ESI', financial_year: fyYear, version: 1,
            is_active: true, configuration: { employee_percentage: 0.75, employer_percentage: 3.25 }, effective_from: effectiveFrom, effective_to: effectiveTo
          }
        });
      }

      const gratuityRuleExists = await tx.stateComplianceRule.findFirst({ where: { company_id: companyId, rule_type: 'GRATUITY', financial_year: fyYear }});
      if (!gratuityRuleExists) {
        await tx.stateComplianceRule.create({
          data: {
            company_id: companyId, state_code: 'GLOBAL', rule_type: 'GRATUITY', financial_year: fyYear, version: 1,
            is_active: true, configuration: { days_factor: 15, working_days: 26 }, effective_from: effectiveFrom, effective_to: effectiveTo
          }
        });
      }

      const taxSlabExists = await tx.taxSlab.findFirst({ where: { financial_year: fyYear }});
      if (!taxSlabExists) {
        await tx.taxSlab.create({
          data: {
            financial_year: fyYear, regime: 'NEW', min_income: new Decimal(0), max_income: new Decimal(300000), rate: new Decimal(0), version: 1, effective_from: effectiveFrom, effective_to: effectiveTo
          }
        });
        await tx.taxSlab.create({
          data: {
            financial_year: fyYear, regime: 'NEW', min_income: new Decimal(300001), max_income: new Decimal(700000), rate: new Decimal(5), version: 1, effective_from: effectiveFrom, effective_to: effectiveTo
          }
        });
      }
    });
  }
}
