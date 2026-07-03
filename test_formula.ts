import { FormulaEngine, PayrollFormulaContext } from './src/services/formula.service.js';

async function runTests() {
  console.log("=== RUNNING FORMULA TESTS ===");
  let passed = 0;
  let failed = 0;

  function runTest(name: string, formula: string, variables: PayrollFormulaContext, shouldPass: boolean) {
    try {
      const result = FormulaEngine.evaluate(formula, variables);
      if (shouldPass) {
        console.log(`PASS: ${name} => ${result}`);
        passed++;
      } else {
        console.error(`FAIL: ${name} => Expected error but got ${result}`);
        failed++;
      }
    } catch (err: any) {
      if (!shouldPass) {
        console.log(`PASS: ${name} => Got expected error: ${err.message}`);
        passed++;
      } else {
        console.error(`FAIL: ${name} => Unexpected error: ${err.message}`);
        failed++;
      }
    }
  }

  // Case A: overtime_hours = 12 PASS
  runTest("Case A: overtime_hours = 12", "overtime_hours * 500", { overtime_hours: 12 }, true);

  // Case B: sales_amount = 500000 PASS
  runTest("Case B: sales_amount = 500000", "sales_amount * commission_rate", { sales_amount: 500000, commission_rate: 0.10 }, true);

  // Case C: missing overtime_hours FAIL
  runTest("Case C: missing overtime_hours", "overtime_hours * 500", {}, false);

  // Case D: coalesce(missing,0) PASS
  runTest("Case D: coalesce(missing,0)", "coalesce(overtime_hours, 0) * 500", {}, true);

  // Case E: coalesce with variable missing and 2nd variable missing
  runTest("Case E: coalesce completely missing", "coalesce(overtime_hours, sales_amount)", {}, false);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

runTests();
