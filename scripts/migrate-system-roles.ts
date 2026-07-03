import 'dotenv/config';
import prisma from '../src/lib/prisma.ts';

async function migrateSystemRoles() {
  console.log('Starting System Roles Migration...');

  const components = await prisma.salaryComponent.findMany();
  let updatedStats: Record<string, number> = {};
  let skipped = 0;

  for (const comp of components) {
    if (comp.system_role) {
      skipped++;
      continue;
    }

    let targetRole: string | null = null;
    
    // Map legacy codes to system roles
    if (comp.code === 'BASIC') targetRole = 'BASIC';
    else if (comp.code === 'HRA') targetRole = 'HRA';
    else if (comp.code === 'PF') targetRole = 'PF_EMPLOYEE';
    else if (comp.code === 'EMPLOYER_PF') targetRole = 'PF_EMPLOYER';
    else if (comp.code === 'PT') targetRole = 'PT';
    else if (comp.code === 'TDS') targetRole = 'TDS';
    else if (comp.code === 'SPECIAL') targetRole = 'SPECIAL_ALLOWANCE';

    if (targetRole) {
      await prisma.salaryComponent.update({
        where: { id: comp.id },
        data: { system_role: targetRole as any }
      });
      updatedStats[targetRole] = (updatedStats[targetRole] || 0) + 1;
    } else {
      skipped++;
    }
  }

  console.log('\nMigration Complete.');
  console.log('Updated:');
  for (const [role, count] of Object.entries(updatedStats)) {
    console.log(`${role}: ${count}`);
  }
  console.log(`Skipped: ${skipped}`);
}

migrateSystemRoles()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
