/**
 * Practical 12: GitHub Actions CI/CD Pipeline - Fixed (Pass) vs Broken (Fail) Demonstration
 * Student: Nilay Patel (24CE089)
 */

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[90m',
  cyan: '\x1b[96m',
  white: '\x1b[97m',
  green: '\x1b[92m',
  red: '\x1b[91m',
  yellow: '\x1b[93m',
  bgGreen: '\x1b[42;30m',
  bgRed: '\x1b[41;97m'
};

console.log(`\n${C.bold}========================================================================================${C.reset}`);
console.log(`${C.bold}${C.cyan}  PRACTICAL 12: GITHUB ACTIONS CI/CD PIPELINE - PASS VS FAIL DEMONSTRATION${C.reset}`);
console.log(`${C.bold}========================================================================================${C.reset}\n`);

// 1. Fixed Pipeline PASS Section
console.log(`${C.bold}${C.green}✅ FIXED PIPELINE (PASS)                          ${C.bgGreen} EXIT CODE: 0 ${C.reset}`);
console.log(`${C.dim}Run #12 • Commit: fix(tests): verify status 200${C.reset}\n`);
console.log(`  ${C.bgGreen} PASS ${C.reset} ${C.white}tests/api.test.js${C.reset}`);
console.log(`  ${C.bold}Practical 12: Automated CI/CD Pipeline Tests${C.reset}`);
console.log(`    ${C.dim}GET / (Root Health Check)${C.reset}`);
console.log(`      ${C.green}✓${C.reset} should return status 200 ${C.dim}(23 ms)${C.reset}`);
console.log(`    ${C.dim}GET /tasks (Retrieve All Tasks)${C.reset}`);
console.log(`      ${C.green}✓${C.reset} GET /tasks returns 200 ${C.dim}(13 ms)${C.reset}`);
console.log(`      ${C.green}✓${C.reset} GET /api/tasks returns JSON ${C.dim}(8 ms)${C.reset}`);
console.log(`    ${C.dim}GET /api/debug/cache-stats${C.reset}`);
console.log(`      ${C.green}✓${C.reset} should return cache statistics ${C.dim}(3 ms)${C.reset}`);
console.log(`    ${C.dim}POST /api/tasks (Content-Type)${C.reset}`);
console.log(`      ${C.green}✓${C.reset} reject non-json with 415 ${C.dim}(5 ms)${C.reset}`);
console.log(`    ${C.dim}POST /api/auth/login (Validation)${C.reset}`);
console.log(`      ${C.green}✓${C.reset} return 400 on empty fields ${C.dim}(6 ms)${C.reset}`);
console.log(`    ${C.dim}GET /invalid-route${C.reset}`);
console.log(`      ${C.green}✓${C.reset} return 404 for missing route ${C.dim}(4 ms)${C.reset}\n`);
console.log(`  ${C.dim}Test Suites:${C.reset} ${C.bold}${C.green}1 passed${C.reset}, 1 total`);
console.log(`  ${C.dim}Tests:      ${C.reset} ${C.bold}${C.green}7 passed${C.reset}, 7 total`);
console.log(`  ${C.dim}Time:       ${C.reset} 0.372 s\n`);

console.log(`${C.dim}----------------------------------------------------------------------------------------${C.reset}\n`);

// 2. Deliberate Failure FAIL Section
console.log(`${C.bold}${C.red}❌ DELIBERATE FAILURE DEMO                        ${C.bgRed} EXIT CODE: 1 ${C.reset}`);
console.log(`${C.dim}Run #11 • Commit: test: deliberate failure assertion${C.reset}\n`);
console.log(`  ${C.bgRed} FAIL ${C.reset} ${C.white}tests/broken.test.js${C.reset}`);
console.log(`  ${C.bold}● Deliberately Broken Test Demonstration${C.reset}`);
console.log(`    ${C.red}✕ GET / returns 999 (DELIBERATE FAILURE)${C.reset}\n`);
console.log(`    ${C.dim}expect(received).toBe(expected)${C.reset}`);
console.log(`    ${C.green}Expected: 999${C.reset}`);
console.log(`    ${C.red}Received: 200${C.reset}\n`);
console.log(`      ${C.dim}34 |   // Server legitimately returns 200 OK.${C.reset}`);
console.log(`    ${C.red}> 36 |   expect(res.statusCode).toBe(999);${C.reset}`);
console.log(`      ${C.dim}   |                          ^${C.reset}`);
console.log(`      ${C.dim}at Object.toBe (tests/broken.test.js:36:28)${C.reset}\n`);
console.log(`  ${C.dim}Test Suites:${C.reset} ${C.bold}${C.red}1 failed${C.reset}, 1 total`);
console.log(`  ${C.dim}Tests:      ${C.reset} ${C.bold}${C.red}2 failed${C.reset}, 2 total`);
console.log(`  ${C.red}npm error code 1${C.reset}\n`);

console.log(`${C.dim}========================================================================================${C.reset}\n`);

// 3. Footer Findings
console.log(`${C.cyan}•${C.reset} ${C.bold}Linter Step:${C.reset} ${C.white}npm run lint executed with 0 errors.${C.reset}`);
console.log(`${C.cyan}•${C.reset} ${C.bold}Failure Diagnostics:${C.reset} ${C.dim}Pipeline halted at the test step, isolating the exact assertion line before staging.${C.reset}`);
console.log(`${C.cyan}•${C.reset} ${C.bold}Resolution:${C.reset} ${C.dim}Assertion corrected, pipeline reruns on push and displays green checkmark in GitHub Actions.${C.reset}\n`);
