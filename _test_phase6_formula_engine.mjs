import { FormulaEngine } from './src/services/formula.service.ts';

async function runTests() {
  console.log('--- STARTING PHASE 6 FORMULA ENGINE TESTS ---');
  let passed = 0;
  let failed = 0;

  const testCases = [
    { name: 'Case A', formula: 'basic * 0.12', expectValid: true },
    { name: 'Case B', formula: 'min(basic * 0.12, 1800)', expectValid: true },
    { name: 'Case C', formula: 'sales_amount * 0.05', expectValid: true },
    { name: 'Case D', formula: 'process.env', expectValid: false },
    { name: 'Case E', formula: 'eval("alert(1)")', expectValid: false },
    { name: 'Case F', formula: 'window.alert()', expectValid: false },
    { name: 'Case G', formula: 'unknownVariable', expectValid: false },
  ];

  for (const tc of testCases) {
    const res = FormulaEngine.validate(tc.formula);
    if (res.valid === tc.expectValid) {
      console.log(`[PASS] ${tc.name}: ${tc.formula}`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name}: ${tc.formula} | Expected valid=${tc.expectValid}, got=${res.valid} (error: ${res.error})`);
      failed++;
    }
  }

  console.log('\n--- EVALUATION TESTS ---');
  // Simple evaluation test just to be sure AST runs
  const evalRes = FormulaEngine.evaluate('min(basic * 0.12, 1800)', { basic: 20000 });
  if (evalRes === 1800) {
    console.log('[PASS] Evaluated min(basic * 0.12, 1800) with basic=20000 -> 1800');
  } else {
    console.error(`[FAIL] Expected 1800, got ${evalRes}`);
    failed++;
  }

  const evalRes2 = FormulaEngine.evaluate('sales_amount * 0.05', { sales_amount: 10000 });
  if (evalRes2 === 500) {
    console.log('[PASS] Evaluated sales_amount * 0.05 with sales_amount=10000 -> 500');
  } else {
    console.error(`[FAIL] Expected 500, got ${evalRes2}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
