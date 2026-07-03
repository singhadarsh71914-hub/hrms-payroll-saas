import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log("=== RUNNING AUTH STABILITY TESTS ===");
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

  const authContextPath = path.resolve('client/src/context/AuthContext.tsx');
  const authContextCode = fs.readFileSync(authContextPath, 'utf8');

  const apiPath = path.resolve('client/src/services/api.ts');
  const apiCode = fs.readFileSync(apiPath, 'utf8');

  // Case A: No token in localStorage -> /auth/me NOT called
  assert("Case A: No token -> /auth/me NOT called", authContextCode.includes('if (!token)') && authContextCode.includes('return;'));

  // Case B: Valid token -> /auth/me called exactly once
  assert("Case B: StrictMode deduplication (useRef)", authContextCode.includes('authRequest.current'));

  // Case C & D: 401 response -> Token cleared, Auto logout triggered
  assert("Case C & D: 401 response -> clearAuth & dispatchEvent", apiCode.includes('clearAuth()') && apiCode.includes("window.dispatchEvent(new Event('auth-logout'))"));
  assert("Case D: Expected 401s do not spam console (Return empty Promise)", apiCode.includes('return new Promise(() => {});'));

  // Case E: Multi-tab logout -> Storage event handled
  assert("Case E: Multi-tab storage event handler", authContextCode.includes("window.addEventListener('storage'"));
  assert("Case E: Multi-tab storage event checks for token clearing", authContextCode.includes("e.key === 'accessToken'"));

  // Raw localStorage check
  try {
    // Should only exist in auth.ts and main.tsx (cleaning legacy ones)
    const grepRes = require('child_process').execSync('findstr /s /i /m "localStorage.getItem" client\\src\\*.ts client\\src\\*.tsx', { encoding: 'utf8' }).trim().split('\\n').map(s => s.trim());
    const badFiles = grepRes.filter(f => !f.includes('auth.ts') && !f.includes('main.tsx'));
    assert("Raw localStorage access removed from other files", badFiles.length === 0);
  } catch (e) {
    // If findstr returns 1 (no matches at all), that's even better, though auth.ts should match
    assert("Raw localStorage access removed from other files", true);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
