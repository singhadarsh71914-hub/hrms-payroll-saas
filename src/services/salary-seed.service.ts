import prisma from '../lib/prisma.ts';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

/**
 * Default salary component definitions.
 * These are seeded once per company when the structure has 0 components.
 *
 * Calculation logic:
 *  - Basic Pay        40% of monthly CTC
 *  - HRA              20% of monthly CTC
 *  - Special Allow.   remainder  (ctc - basic - hra)  stored as PERCENTAGE_OF_CTC = 40
 *  - Provident Fund   12% of Basic  (statutory, capped at ₹1,800)
 *  - Professional Tax ₹200 flat
 */
const DEFAULT_COMPONENTS = [
  { code: 'BASIC',    name: 'Basic Pay',             type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'PERCENTAGE_OF_CTC'  as const, value: 40, maxLimit: null, sequence: 1, isTaxable: true,  isStatutory: false, systemRole: 'BASIC' as const },
  { code: 'HRA',      name: 'House Rent Allowance',  type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'PERCENTAGE_OF_CTC'  as const, value: 20, maxLimit: null, sequence: 2, isTaxable: false, isStatutory: false, systemRole: 'HRA' as const },
  { code: 'SPECIAL',  name: 'Special Allowance',     type: 'EARNING'   as const, category: 'FIXED'     as const, calcType: 'REMAINDER_OF_CTC'   as const, value: 0,  maxLimit: null, sequence: 3, isTaxable: true,  isStatutory: false, systemRole: 'SPECIAL_ALLOWANCE' as const },
  { code: 'PF',       name: 'Provident Fund',        type: 'DEDUCTION' as const, category: 'STATUTORY' as const, calcType: 'PERCENTAGE_OF_BASIC' as const, value: 12, maxLimit: 1800, sequence: 4, isTaxable: false, isStatutory: true,  systemRole: 'PF_EMPLOYEE' as const },
  { code: 'PT',       name: 'Professional Tax',      type: 'DEDUCTION' as const, category: 'STATUTORY' as const, calcType: 'FLAT_AMOUNT'          as const, value: 200, maxLimit: null, sequence: 5, isTaxable: false, isStatutory: true,  systemRole: 'PT' as const },
];

export class SalarySeedService {
  /**
   * Idempotently seeds default salary components for a company.
   * Only runs when the salary structure has 0 linked components.
   * Never creates duplicates (uses upsert on company_id+code).
   */
  static async seedDefaultComponents(companyId: string, structureId: string): Promise<void> {
    // Guard: only seed if structure currently has 0 components
    const existing = await prisma.salaryStructureComponent.count({
      where: { salary_structure_id: structureId }
    });
    if (existing > 0) {
      return; // Already seeded, nothing to do
    }

    await prisma.$transaction(async (tx) => {
      const componentIds: Record<string, string> = {};

      // 1. Upsert each SalaryComponent (idempotent by company_id+code unique constraint)
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

      // 2. Create SalaryStructureComponent links (only once — guarded by the count check above)
      for (const def of DEFAULT_COMPONENTS) {
        await tx.salaryStructureComponent.create({
          data: {
            salary_structure_id: structureId,
            salary_component_id: componentIds[def.code],
            calculation_type:    def.calcType,
            value:               new Decimal(def.value),
            max_limit:           def.maxLimit ? new Decimal(def.maxLimit) : null,
            sequence:            def.sequence,
          },
        });
      }
    });
  }

  /**
   * Returns true if a salary structure has at least 1 component.
   */
  static async hasComponents(structureId: string): Promise<boolean> {
    const count = await prisma.salaryStructureComponent.count({
      where: { salary_structure_id: structureId }
    });
    return count > 0;
  }
}
