import 'dotenv/config';
import prisma from './src/lib/prisma';

async function runAudit() {
  const complianceRules = await prisma.stateComplianceRule.count();
  const complianceRulesFY2026 = await prisma.stateComplianceRule.count({
    where: { financial_year: 2026 }
  });
  
  const taxSlabs = await prisma.taxSlab.count();
  
  console.log(JSON.stringify({
    complianceRules,
    complianceRulesFY2026,
    taxSlabs
  }, null, 2));
}

runAudit()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
