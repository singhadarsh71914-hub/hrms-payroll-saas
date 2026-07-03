import 'dotenv/config';
import prisma from './src/lib/prisma.ts';

// We'll write this script as a standalone tester that tests both the API directly and also UI.

async function runTests() {
  console.log('--- STARTING PHASE 2 TESTS ---');
  
  // Clean up any test artifacts before start
  const dbTestCompany = await prisma.company.findFirst();
  const companyId = dbTestCompany.id;

  // Let's create an API token for testing
  const authCookie = ''; // normally we'd login or just test via prisma for API logic
  
  // 1. Test Component Enum
  console.log('Testing: Component Enum supports EMPLOYER_CONTRIBUTION');
  try {
    await prisma.salaryComponent.create({
      data: {
        company_id: companyId,
        name: 'Employer PF Test',
        code: 'EPF_TEST',
        type: 'EMPLOYER_CONTRIBUTION',
        category: 'STATUTORY',
        is_taxable: false
      }
    });
    console.log('[PASS] EMPLOYER_CONTRIBUTION is supported.');
    
    // Clean up
    await prisma.salaryComponent.delete({
      where: { company_id_code: { company_id: companyId, code: 'EPF_TEST' } }
    });
  } catch (err) {
    console.error('[FAIL] EMPLOYER_CONTRIBUTION not supported.', err.message);
  }

  // 2. Test Salary Structure schema validation
  console.log('Testing: Percentage of Basic and Employer Contrib do not count towards CTC');
  const { upsertSalaryStructureSchema } = await import('./src/schemas/salaryStructure.schema.ts');
  const testPayload = {
    name: 'Test Structure',
    components: [
      { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 100, sequence: 1 },
      // The following should NOT trigger the 100% cap error
      { salary_component_id: '1e19335a-937b-402a-9e0a-a5c2f0f4b3df', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_BASIC', value: 10, sequence: 2 },
      { salary_component_id: '716a1c5b-3837-4d7c-87d2-7c3e34b12631', type: 'EMPLOYER_CONTRIBUTION', calculation_type: 'PERCENTAGE_OF_CTC', value: 12, sequence: 3 },
    ]
  };
  
  const result = upsertSalaryStructureSchema.safeParse({ body: testPayload });
  if (result.success) {
    console.log('[PASS] Validation ignored PERCENTAGE_OF_BASIC and EMPLOYER_CONTRIBUTION for 100% cap.');
  } else {
    console.error('[FAIL] Validation threw an error:', result.error.issues);
  }

  console.log('--- PHASE 2 TESTS COMPLETED ---');
  process.exit(0);
}

runTests();
