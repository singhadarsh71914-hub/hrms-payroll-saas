import { upsertSalaryStructureSchema } from './src/schemas/salaryStructure.schema.ts';

function runTestCase(name, data) {
  console.log(`\n--- Running Case: ${name} ---`);
  const result = upsertSalaryStructureSchema.safeParse({ body: data });
  
  if (result.success) {
    console.log(`[PASS] Validation successful.`);
  } else {
    console.log(`[FAIL THROWN] Validation errors:`);
    result.error.issues.forEach(issue => {
      console.log(`  -> ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}

// Case A: VALID (Basic 40%, HRA 20%, Special REMAINDER)
runTestCase('Case A (40/20/40) VALID', {
  name: 'Standard Indian Corporate',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 40, sequence: 1 },
    { salary_component_id: '1e19335a-937b-402a-9e0a-a5c2f0f4b3df', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 20, sequence: 2 },
    { salary_component_id: '716a1c5b-3837-4d7c-87d2-7c3e34b12631', type: 'EARNING', calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 3 },
  ]
});

// Case B: VALID (Basic 50%, HRA 30%, Internet 10%, Special REMAINDER)
runTestCase('Case B (50/30/10/10) VALID', {
  name: 'Standard Indian Corporate',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 50, sequence: 1 },
    { salary_component_id: '1e19335a-937b-402a-9e0a-a5c2f0f4b3df', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 30, sequence: 2 },
    { salary_component_id: '716a1c5b-3837-4d7c-87d2-7c3e34b12631', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 10, sequence: 3 },
    { salary_component_id: 'b6222b64-88aa-462f-87d7-f49c00b0805f', type: 'EARNING', calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 4 },
  ]
});

// Case C: INVALID (Basic 60%, HRA 30%, Internet 20%) -> Exceeds 100%
runTestCase('Case C (60/30/20) INVALID', {
  name: 'Exceeds CTC',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 60, sequence: 1 },
    { salary_component_id: '1e19335a-937b-402a-9e0a-a5c2f0f4b3df', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 30, sequence: 2 },
    { salary_component_id: '716a1c5b-3837-4d7c-87d2-7c3e34b12631', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 20, sequence: 3 },
  ]
});

// Case D: INVALID (Double Remainder)
runTestCase('Case D (Double Remainder) INVALID', {
  name: 'Double Remainder',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 40, sequence: 1 },
    { salary_component_id: '1e19335a-937b-402a-9e0a-a5c2f0f4b3df', type: 'EARNING', calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 2 },
    { salary_component_id: '716a1c5b-3837-4d7c-87d2-7c3e34b12631', type: 'EARNING', calculation_type: 'REMAINDER_OF_CTC', value: 0, sequence: 3 },
  ]
});

// Case E: INVALID (max_limit negative)
runTestCase('Case E (max_limit negative) INVALID', {
  name: 'Negative Max Limit',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'DEDUCTION', calculation_type: 'PERCENTAGE_OF_BASIC', value: 12, max_limit: -100, sequence: 1 },
  ]
});

// Case F: INVALID (duplicate component IDs & sequences)
runTestCase('Case F (Duplicate IDs and sequences) INVALID', {
  name: 'Duplicates',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 40, sequence: 1 },
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 20, sequence: 1 },
  ]
});

// Case G: INVALID (percentage out of range)
runTestCase('Case G (Percentage > 100) INVALID', {
  name: 'Out of Range',
  components: [
    { salary_component_id: 'e10f1355-0814-4c40-a12b-3121ef587428', type: 'EARNING', calculation_type: 'PERCENTAGE_OF_CTC', value: 150, sequence: 1 },
  ]
});

