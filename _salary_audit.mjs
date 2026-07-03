// VERIFY: Seed components, then simulate payroll for active employees
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma } from '@prisma/client';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/my_ai_project' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const { Decimal } = Prisma;

const STRUCTURE_ID = 'ff6927e7-3b1d-48cf-aad3-14c7703fc492';
const COMPANY_ID   = '11d75673-7edf-4fb7-9fd6-aea255984813';

const DEFAULT_COMPONENTS = [
  { code: 'BASIC',   name: 'Basic Pay',            type: 'EARNING',   category: 'FIXED',     calcType: 'PERCENTAGE_OF_CTC',   value: 40,  seq: 1, taxable: true,  statutory: false },
  { code: 'HRA',     name: 'House Rent Allowance', type: 'EARNING',   category: 'FIXED',     calcType: 'PERCENTAGE_OF_CTC',   value: 20,  seq: 2, taxable: false, statutory: false },
  { code: 'SPECIAL', name: 'Special Allowance',    type: 'EARNING',   category: 'FIXED',     calcType: 'PERCENTAGE_OF_CTC',   value: 40,  seq: 3, taxable: true,  statutory: false },
  { code: 'PF',      name: 'Provident Fund',       type: 'DEDUCTION', category: 'STATUTORY', calcType: 'PERCENTAGE_OF_BASIC', value: 12,  seq: 4, taxable: false, statutory: true  },
  { code: 'PT',      name: 'Professional Tax',     type: 'DEDUCTION', category: 'STATUTORY', calcType: 'FLAT_AMOUNT',         value: 200, seq: 5, taxable: false, statutory: true  },
];

function resolveAmount(calcType, value, ctcMonthly, basicAmt) {
  switch (calcType) {
    case 'PERCENTAGE_OF_CTC':   return Math.round(ctcMonthly * value / 100);
    case 'PERCENTAGE_OF_BASIC': return Math.round(basicAmt * value / 100);
    case 'FLAT_AMOUNT':         return value;
    default:                    return 0;
  }
}

async function main() {
  // 1. SEED: check if structure already has components
  const existing = await prisma.salaryStructureComponent.count({
    where: { salary_structure_id: STRUCTURE_ID }
  });

  if (existing === 0) {
    console.log('\n>>> Seeding default components...');
    const componentIds = {};
    for (const def of DEFAULT_COMPONENTS) {
      const comp = await prisma.salaryComponent.upsert({
        where: { company_id_code: { company_id: COMPANY_ID, code: def.code } },
        update: { name: def.name, is_active: true },
        create: {
          company_id:   COMPANY_ID,
          code:         def.code,
          name:         def.name,
          type:         def.type,
          category:     def.category,
          is_taxable:   def.taxable,
          is_statutory: def.statutory,
          is_active:    true,
        },
      });
      componentIds[def.code] = comp.id;
      console.log(`  Created component: ${def.name} (${def.code}) → ${comp.id}`);
    }

    for (const def of DEFAULT_COMPONENTS) {
      await prisma.salaryStructureComponent.create({
        data: {
          salary_structure_id: STRUCTURE_ID,
          salary_component_id: componentIds[def.code],
          calculation_type:    def.calcType,
          value:               new Decimal(def.value),
          sequence:            def.seq,
        },
      });
    }
    console.log('  Done seeding!');
  } else {
    console.log(`\n>>> Structure already has ${existing} components, skipping seed.`);
  }

  // 2. VERIFY: load structure with components
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: STRUCTURE_ID },
    include: {
      components: {
        include: { salary_component: true },
        orderBy: { sequence: 'asc' }
      }
    }
  });
  console.log(`\n=== SalaryStructure: "${structure.name}" ===`);
  for (const c of structure.components) {
    console.log(`  [${c.sequence}] ${c.salary_component.name} (${c.salary_component.type}) | ${c.calculation_type} = ${c.value}`);
  }

  // 3. SIMULATE: payroll calculation for each eligible employee
  const now = new Date();
  const employees = await prisma.employee.findMany({
    where: { company_id: COMPANY_ID, employment_status: 'ACTIVE' },
    include: {
      salaries: {
        where: {
          effective_from: { lte: now },
          OR: [{ effective_to: null }, { effective_to: { gte: now } }]
        },
        orderBy: { effective_from: 'desc' },
        take: 1,
        include: {
          salary_structure: {
            include: {
              components: { include: { salary_component: true }, orderBy: { sequence: 'asc' } }
            }
          }
        }
      }
    }
  });

  console.log(`\n=== Payroll Simulation (${employees.length} active employees) ===`);
  let totalGross = 0, totalNet = 0, eligible = 0;

  for (const emp of employees) {
    const sal = emp.salaries[0];
    if (!sal) continue;
    eligible++;

    const ctcMonthly = Number(sal.ctc_monthly);
    const comps = sal.salary_structure.components;

    // Resolve Basic first
    const basicComp = comps.find(c => c.salary_component.code === 'BASIC');
    const basicAmt = basicComp ? resolveAmount(basicComp.calculation_type, Number(basicComp.value), ctcMonthly, 0) : 0;

    let gross = 0;
    const lines = [];
    for (const c of comps) {
      const amt = resolveAmount(c.calculation_type, Number(c.value), ctcMonthly, basicAmt);
      if (c.salary_component.type === 'EARNING') {
        gross += amt;
        lines.push(`${c.salary_component.name}=₹${amt.toLocaleString('en-IN')}`);
      }
    }

    // PF
    const pfComp = comps.find(c => c.salary_component.code === 'PF');
    const pf = pfComp ? Math.min(resolveAmount(pfComp.calculation_type, Number(pfComp.value), ctcMonthly, basicAmt), 1800) : Math.min(basicAmt * 0.12, 1800);
    // PT
    const ptComp = comps.find(c => c.salary_component.code === 'PT');
    const pt = ptComp ? resolveAmount(ptComp.calculation_type, Number(ptComp.value), ctcMonthly, basicAmt) : 0;

    const deductions = pf + pt;
    const net = gross - deductions;
    totalGross += gross;
    totalNet += net;

    console.log(`✅ ${emp.first_name} ${emp.last_name} (${emp.employee_code}) | CTC/mo ₹${ctcMonthly.toLocaleString('en-IN')}`);
    console.log(`   Earnings: ${lines.join(', ')}`);
    console.log(`   Gross=₹${gross.toLocaleString('en-IN')} | PF=₹${pf} | PT=₹${pt} | Net=₹${net.toLocaleString('en-IN')}`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Eligible: ${eligible} | Total Gross: ₹${totalGross.toLocaleString('en-IN')} | Total Net: ₹${totalNet.toLocaleString('en-IN')}`);
  if (eligible > 0 && totalGross > 0) {
    console.log('\n✅ VERIFICATION PASSED: Payroll will produce non-zero payslips.');
  } else {
    console.log('\n❌ VERIFICATION FAILED: Check salary records and structure.');
  }
}

main().catch(console.error).finally(() => { pool.end(); prisma.$disconnect(); });
