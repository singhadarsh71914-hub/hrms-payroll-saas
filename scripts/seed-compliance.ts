import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCompliance() {
  const fy = 2026;
  const effectiveFrom = new Date('2024-04-01T00:00:00Z');
  const effectiveTo = new Date('2031-03-31T23:59:59Z');

  // PT Rules
  const ptRules = [
    { state: 'MH', config: { slabs: [{ min: 0, max: 7500, amount: 0 }, { min: 7501, max: 10000, amount: 175 }, { min: 10001, max: null, amount: 200, feb_amount: 300 }] } },
    { state: 'KA', config: { slabs: [{ min: 0, max: 14999, amount: 0 }, { min: 15000, max: null, amount: 200 }] } },
    { state: 'TN', config: { slabs: [{ min: 0, max: 21000, amount: 0 }, { min: 21001, max: 30000, amount: 135 }, { min: 30001, max: 45000, amount: 315 }, { min: 45001, max: 60000, amount: 390 }, { min: 60001, max: 75000, amount: 495 }, { min: 75001, max: null, amount: 1250 }], frequency: 'MONTHLY', monthly_distribution: [208,208,208,208,208,210,208,208,208,208,208,210] } },
    { state: 'WB', config: { slabs: [{ min: 0, max: 10000, amount: 0 }, { min: 10001, max: 15000, amount: 110 }, { min: 15001, max: 25000, amount: 130 }, { min: 25001, max: 40000, amount: 150 }, { min: 40001, max: null, amount: 200 }] } },
    { state: 'DL', config: { slabs: [{ min: 0, max: null, amount: 0 }] } },
    { state: 'GJ', config: { slabs: [{ min: 0, max: 5999, amount: 0 }, { min: 6000, max: 8999, amount: 80 }, { min: 9000, max: 11999, amount: 150 }, { min: 12000, max: null, amount: 200 }] } }
  ];

  for (const pt of ptRules) {
    await prisma.stateComplianceRule.upsert({
      where: {
        company_id_state_code_rule_type_financial_year_version: {
          company_id: '',
          state_code: pt.state,
          rule_type: 'PT',
          financial_year: fy,
          version: 1
        }
      },
      update: {},
      create: {
        state_code: pt.state,
        financial_year: fy,
        rule_type: 'PT',
        configuration: pt.config,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        version: 1
      }
    }).catch(async (e) => {
        // Fallback for unique constraint without company_id
        await prisma.stateComplianceRule.create({
            data: {
                state_code: pt.state,
                financial_year: fy,
                rule_type: 'PT',
                configuration: pt.config,
                effective_from: effectiveFrom,
                effective_to: effectiveTo,
                version: 1
            }
        }).catch(() => {});
    });
  }

  // ESI
  await prisma.stateComplianceRule.create({
    data: {
      state_code: 'GLOBAL',
      financial_year: fy,
      rule_type: 'ESI',
      configuration: { employee_rate: 0.75, employer_rate: 3.25, salary_threshold: 21000 },
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      version: 1
    }
  }).catch(() => {});

  // LWF
  await prisma.stateComplianceRule.create({
    data: {
      state_code: 'MH',
      financial_year: fy,
      rule_type: 'LWF',
      configuration: { months: [6, 12], frequency: 'HALF_YEARLY', employee_amount: 12, employer_amount: 36 },
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      version: 1
    }
  }).catch(() => {});

  await prisma.stateComplianceRule.create({
    data: {
      state_code: 'KA',
      financial_year: fy,
      rule_type: 'LWF',
      configuration: { months: [12], frequency: 'YEARLY', employee_amount: 20, employer_amount: 40 },
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      version: 1
    }
  }).catch(() => {});

  // BONUS ACT
  await prisma.bonusRule.create({
    data: {
      financial_year: fy,
      min_salary_limit: "21000",
      min_bonus_percent: "8.33",
      max_bonus_percent: "20",
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      version: 1
    }
  }).catch(() => {});

  console.log("Compliance seeding completed.");
  await prisma.$disconnect();
}

seedCompliance().catch(e => {
  console.error(e);
  process.exit(1);
});
