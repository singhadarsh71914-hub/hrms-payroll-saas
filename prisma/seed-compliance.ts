import 'dotenv/config';
import { PrismaClient, RuleType, TaxRegime } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 5;
  const effectiveFrom = new Date(`${currentYear - 2}-04-01T00:00:00.000Z`);
  const effectiveTo = new Date(`${nextYear}-03-31T23:59:59.999Z`);
  const financialYear = 2026; // Setting a default FY based on requirements

  // 1. PT Rules
  const ptRules = [
    {
      state_code: 'MH',
      rule_type: RuleType.PT,
      configuration: {
        slabs: [
          { min: 0, max: 7500, amount: 0 },
          { min: 7501, max: 10000, amount: 175 },
          { min: 10001, max: null, amount: 200, feb_amount: 300 } // Special case in Feb
        ]
      }
    },
    {
      state_code: 'KA',
      rule_type: RuleType.PT,
      configuration: {
        slabs: [
          { min: 0, max: 14999, amount: 0 },
          { min: 15000, max: null, amount: 200 }
        ]
      }
    },
    {
      state_code: 'TN',
      rule_type: RuleType.PT,
      configuration: {
        slabs: [
          { min: 0, max: 21000, amount: 0 },
          { min: 21001, max: 30000, amount: 135 },
          { min: 30001, max: 45000, amount: 315 },
          { min: 45001, max: 60000, amount: 390 },
          { min: 60001, max: 75000, amount: 495 },
          { min: 75001, max: null, amount: 1250 } // Half yearly collected as 1250? Normally collected per month as ~208, but some do half-yearly
        ],
        frequency: "MONTHLY",
        monthly_distribution: [208, 208, 208, 208, 208, 210, 208, 208, 208, 208, 208, 210] // 2500 per year
      }
    },
    {
      state_code: 'WB',
      rule_type: RuleType.PT,
      configuration: {
        slabs: [
          { min: 0, max: 10000, amount: 0 },
          { min: 10001, max: 15000, amount: 110 },
          { min: 15001, max: 25000, amount: 130 },
          { min: 25001, max: 40000, amount: 150 },
          { min: 40001, max: null, amount: 200 }
        ]
      }
    },
    {
      state_code: 'DL',
      rule_type: RuleType.PT,
      configuration: {
        slabs: [
          { min: 0, max: null, amount: 0 }
        ] // Delhi does not have PT
      }
    }
  ];

  for (const rule of ptRules) {
    const existing = await prisma.stateComplianceRule.findFirst({
      where: {
        company_id: null,
        state_code: rule.state_code,
        rule_type: rule.rule_type,
        financial_year: financialYear,
        version: 1
      }
    });

    if (existing) {
      await prisma.stateComplianceRule.update({
        where: { id: existing.id },
        update: { configuration: rule.configuration as any }
      });
    } else {
      await prisma.stateComplianceRule.create({
        data: {
          company_id: null,
          state_code: rule.state_code,
          financial_year: financialYear,
          rule_type: rule.rule_type,
          configuration: rule.configuration as any,
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
        }
      });
    }
  }

  // 2. ESI Rule (GLOBAL)
  const esiExisting = await prisma.stateComplianceRule.findFirst({
    where: {
      company_id: null,
      state_code: 'GLOBAL',
      rule_type: RuleType.ESI,
      financial_year: financialYear,
      version: 1
    }
  });

  if (!esiExisting) {
    await prisma.stateComplianceRule.create({
      data: {
        company_id: null,
        state_code: 'GLOBAL',
        financial_year: financialYear,
        rule_type: RuleType.ESI,
        configuration: {
          employee_rate: 0.75,
          employer_rate: 3.25,
          salary_threshold: 21000
        },
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
      }
    });
  }

  // 3. LWF Rules
  const lwfRules = [
    {
      state_code: 'MH',
      rule_type: RuleType.LWF,
      configuration: {
        employee_amount: 12,
        employer_amount: 36,
        frequency: "HALF_YEARLY",
        months: [6, 12] // June and Dec
      }
    },
    {
      state_code: 'KA',
      rule_type: RuleType.LWF,
      configuration: {
        employee_amount: 20,
        employer_amount: 40,
        frequency: "YEARLY",
        months: [12] // December
      }
    },
    {
      state_code: 'GLOBAL', // Default
      rule_type: RuleType.LWF,
      configuration: {
        employee_amount: 0,
        employer_amount: 0,
        frequency: "MONTHLY",
        months: [1,2,3,4,5,6,7,8,9,10,11,12]
      }
    }
  ];

  for (const rule of lwfRules) {
    const existing = await prisma.stateComplianceRule.findFirst({
      where: {
        company_id: null,
        state_code: rule.state_code,
        rule_type: rule.rule_type,
        financial_year: financialYear,
        version: 1
      }
    });

    if (existing) {
      await prisma.stateComplianceRule.update({
        where: { id: existing.id },
        update: { configuration: rule.configuration as any }
      });
    } else {
      await prisma.stateComplianceRule.create({
        data: {
          company_id: null,
          state_code: rule.state_code,
          financial_year: financialYear,
          rule_type: rule.rule_type,
          configuration: rule.configuration as any,
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
        }
      });
    }
  }

  // 4. GRATUITY (GLOBAL)
  const gratuityExisting = await prisma.stateComplianceRule.findFirst({
    where: {
      company_id: null,
      state_code: 'GLOBAL',
      rule_type: RuleType.GRATUITY,
      financial_year: financialYear,
      version: 1
    }
  });

  if (!gratuityExisting) {
    await prisma.stateComplianceRule.create({
      data: {
        company_id: null,
        state_code: 'GLOBAL',
        financial_year: financialYear,
        rule_type: RuleType.GRATUITY,
        configuration: {
          minimum_service_years: 5,
          days_factor: 15,
          working_days: 26
        },
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
      }
    });
  }

  // 5. BONUS ACT
  const bonusExisting = await prisma.bonusRule.findFirst({
    where: {
      company_id: null,
      financial_year: financialYear,
      version: 1
    }
  });

  if (!bonusExisting) {
    await prisma.bonusRule.create({
      data: {
        company_id: null,
        financial_year: financialYear,
        min_salary_limit: 21000,
        min_bonus_percent: 8.33,
        max_bonus_percent: 20.0,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
      }
    });
  }

  // 6. TAX SLABS (NEW REGIME)
  const newRegimeSlabs = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 700000, rate: 5 }, // 7L rebate handles the tax component
    { min: 700001, max: 1000000, rate: 10 },
    { min: 1000001, max: 1200000, rate: 15 },
    { min: 1200001, max: 1500000, rate: 20 },
    { min: 1500001, max: null, rate: 30 },
  ];
  
  for (const slab of newRegimeSlabs) {
    const slabExisting = await prisma.taxSlab.findFirst({
      where: {
        regime: TaxRegime.NEW,
        financial_year: financialYear,
        min_income: slab.min,
        max_income: slab.max === null ? null : slab.max,
        version: 1
      }
    });

    if (!slabExisting) {
      await prisma.taxSlab.create({
        data: {
          regime: TaxRegime.NEW,
          financial_year: financialYear,
          min_income: slab.min,
          max_income: slab.max,
          rate: slab.rate,
          rebate_rules: { max_income_for_rebate: 700000, section: '87A' } as any,
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
        }
      });
    }
  }

  // TAX SLABS (OLD REGIME)
  const oldRegimeSlabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250001, max: 500000, rate: 5 },
    { min: 500001, max: 1000000, rate: 20 },
    { min: 1000001, max: null, rate: 30 },
  ];
  for (const slab of oldRegimeSlabs) {
    const slabExisting = await prisma.taxSlab.findFirst({
      where: {
        regime: TaxRegime.OLD,
        financial_year: financialYear,
        min_income: slab.min,
        max_income: slab.max === null ? null : slab.max,
        version: 1
      }
    });

    if (!slabExisting) {
      await prisma.taxSlab.create({
        data: {
          regime: TaxRegime.OLD,
          financial_year: financialYear,
          min_income: slab.min,
          max_income: slab.max,
          rate: slab.rate,
          rebate_rules: { max_income_for_rebate: 500000, section: '87A' } as any,
          effective_from: effectiveFrom,
          effective_to: effectiveTo,
        }
      });
    }
  }

  console.log("Compliance Rules Seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
