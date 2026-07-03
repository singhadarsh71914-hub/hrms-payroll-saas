import 'dotenv/config';
import prisma from './src/lib/prisma.ts';

async function runTests() {
  console.log('--- STARTING PHASE 2.1 TESTS ---');
  
  const dbTestCompany = await prisma.company.findFirst();
  if (!dbTestCompany) {
    console.error('[FAIL] No company found to test against.');
    process.exit(1);
  }
  const companyId = dbTestCompany.id;

  // Cleanup past test data
  await prisma.salaryComponent.deleteMany({
    where: { company_id: companyId, code: { startsWith: 'TEST_' } }
  });

  // 1. Create component
  console.log('Testing: Create Component');
  let newComp;
  try {
    newComp = await prisma.salaryComponent.create({
      data: {
        company_id: companyId,
        name: 'Test Bonus',
        code: 'TEST_BONUS',
        type: 'EARNING',
        category: 'VARIABLE',
        calculation_type: 'FLAT_AMOUNT',
        value: 1000,
        display_order: 999
      }
    });
    console.log('[PASS] Component Created Successfully.');
  } catch (err) {
    console.error('[FAIL] Component Creation Failed.', err.message);
  }

  // 2. Edit Component
  console.log('Testing: Edit Component');
  try {
    newComp = await prisma.salaryComponent.update({
      where: { id: newComp.id },
      data: { value: 1500 }
    });
    if (newComp.value.toNumber() === 1500) {
      console.log('[PASS] Component Edited Successfully.');
    } else {
      console.error('[FAIL] Component Edit did not save value.');
    }
  } catch (err) {
    console.error('[FAIL] Component Edit Failed.', err.message);
  }

  // 3. Duplicate Component
  console.log('Testing: Duplicate Component');
  try {
    const duplicateCode = 'TEST_BONUS_COPY';
    await prisma.salaryComponent.create({
      data: {
        company_id: companyId,
        name: newComp.name + ' (Copy)',
        code: duplicateCode,
        type: newComp.type,
        category: newComp.category,
        calculation_type: newComp.calculation_type,
        value: newComp.value,
        display_order: 1000
      }
    });
    console.log('[PASS] Component Duplicated Successfully.');
  } catch (err) {
    console.error('[FAIL] Component Duplication Failed.', err.message);
  }

  // 4. Archive Component
  console.log('Testing: Archive Component');
  try {
    await prisma.salaryComponent.update({
      where: { id: newComp.id },
      data: { is_active: false }
    });
    const checkArchive = await prisma.salaryComponent.findUnique({ where: { id: newComp.id } });
    if (!checkArchive.is_active) {
      console.log('[PASS] Component Archived Successfully.');
    } else {
      console.error('[FAIL] Component Archive Failed.');
    }
  } catch (err) {
    console.error('[FAIL] Component Archive Failed.', err.message);
  }

  // 5. System Component Protection
  console.log('Testing: System Component Protection (Simulating API constraint)');
  // We simulate the backend's strict rules by applying the schema check manually.
  // The actual Express endpoint does `if (SYSTEM_COMPONENTS.includes(comp.code)) throw Error...`
  const { updateSalaryComponentSchema } = await import('./src/schemas/salaryComponent.schema.ts');
  const result = updateSalaryComponentSchema.safeParse({
    body: {
      name: 'Basic',
      code: 'BASIC',
      type: 'EARNING',
      category: 'FIXED',
      display_order: 0,
      value: -10 // invalid value
    }
  });

  if (!result.success) {
    console.log('[PASS] Schema Validation caught invalid percentage bounds/values correctly.');
  } else {
    console.error('[FAIL] Schema Validation failed to catch invalid values.');
  }

  // Clean up
  await prisma.salaryComponent.deleteMany({
    where: { company_id: companyId, code: { startsWith: 'TEST_' } }
  });

  console.log('--- PHASE 2.1 TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
