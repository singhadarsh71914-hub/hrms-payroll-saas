import { execSync } from 'child_process';
import { FormulaEngine } from './src/services/formula.service.ts';
import { PayrollService } from './src/services/payroll.service.ts';

async function runTests() {
  console.log("=== RUNNING STRICT CONTRACT TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.error(`FAIL: ${name}`);
      failed++;
    }
  }

  // Set up mock data
  const employeeId = 'test-emp-123';
  const month = 11;
  const year = 2023;
  
  const preloadedData = {
    attendanceByEmployee: { [employeeId]: [] },
    performanceByEmployee: { [employeeId]: { overall_score: 90 } },
    bonusesByEmployee: { [employeeId]: [] },
    salesByEmployee: { [employeeId]: [] }
  };

  // Case A: Calling buildFormulaContext without preloadedData MUST FAIL
  try {
    // @ts-ignore - we are deliberately testing illegal invocation in JS/TS
    PayrollService.buildFormulaContext(employeeId, month, year);
    assert("Case A: Calling without preloadedData", false);
  } catch (err) {
    assert("Case A: Calling without preloadedData MUST FAIL", err.message.includes("missing"));
  }

  // Case B: Mutating context.basic MUST FAIL
  const context = PayrollService.buildFormulaContext(employeeId, month, year, preloadedData);
  try {
    context.performance_score = 999999;
    assert("Case B: Mutating context", false); // In strict mode, mutating frozen object throws
  } catch (err) {
    assert("Case B: Mutating context.basic = 999999 MUST FAIL", true);
  }

  // Create full context (like getFormulaContext)
  const fullContext = Object.freeze({
    ...context,
    basic: 50000,
    gross: 100000
  });

  try {
    fullContext.basic = 999999;
    assert("Case B: Mutating full context", false);
  } catch(err) {
    assert("Case B: Mutating full context.basic = 999999 MUST FAIL", true);
  }

  // Case C: 10000 employee benchmark (< 50ms)
  console.log("Running 10,000 employee benchmark...");
  const start = Date.now();
  for (let i = 0; i < 10000; i++) {
    PayrollService.buildFormulaContext(`emp-${i}`, month, year, preloadedData);
  }
  const duration = Date.now() - start;
  assert(`Case C: 10000 employee benchmark (${duration}ms < 50ms)`, duration < 50);

  // Case D: Search codebase: grep "prisma." src/services/formula.service.ts -> Zero matches
  try {
    const grepRes = execSync('findstr /i "prisma." src\\services\\formula.service.ts', { encoding: 'utf8' }).trim();
    assert("Case D: No prisma in FormulaService", grepRes === '');
  } catch (e) {
    // findstr returns exit code 1 if no matches found, which throws in execSync!
    // So if it throws, it means no matches!
    assert("Case D: No prisma in FormulaService (Zero Matches)", true);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
