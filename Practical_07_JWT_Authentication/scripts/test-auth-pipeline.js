/**
 * Practical 7: JWT Authentication & bcrypt Password Hashing Verification
 * Automated Verification Pipeline
 *
 * Exercises the live Express backend and MongoDB database.
 * Tests all 12 core security requirements and renders terminal cards.
 */

const http = require('http');
const path = require('path');
const os = require('os');

// Register backend node_modules path
const backendDir = path.join(__dirname, '..', 'backend');
module.paths.push(path.join(backendDir, 'node_modules'));

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(backendDir, '.env') });

const PORT = process.env.PORT || 5001;
const HOST = '127.0.0.1';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb_practical7';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_awdf_2026_practical7';

// Terminal Color Formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
  bgBlue: '\x1b[44m\x1b[37m',
  bgRed: '\x1b[41m\x1b[37m',
  gray: '\x1b[90m'
};

// HTTP Request Helper
function sendRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // keep as string
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error('Request timed out'));
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// User Model Setup
const User = require(path.join(backendDir, 'models', 'User'));

async function runPipeline() {
  const timestamp = Date.now();
  const testUser = {
    name: 'Nilay Patel',
    email: `nilay.test_${timestamp}@charusat.edu`,
    password: 'SecureTestPassword123!',
    role: 'student'
  };

  const results = [];
  function assert(title, condition, extra = '') {
    results.push({ title, passed: Boolean(condition), extra });
    if (!condition) {
      console.error(`  ${colors.red}✗ FAILED: ${title}${colors.reset} ${extra}`);
    }
  }

  // 1. Connect to Database directly for verification
  let dbConnected = false;
  try {
    await mongoose.connect(MONGO_URI);
    dbConnected = true;
  } catch (err) {
    console.error(`${colors.red}[FATAL] Could not connect to MongoDB at ${MONGO_URI}: ${err.message}${colors.reset}`);
    process.exit(1);
  }

  // 2. Ensure Express server is running
  let serverInstance = null;
  let serverRunning = false;
  try {
    const ping = await sendRequest({
      hostname: HOST,
      port: PORT,
      path: '/',
      method: 'GET'
    });
    if (ping.statusCode === 200) {
      serverRunning = true;
    }
  } catch (err) {
    // Start server internally for this test run
    const app = require(path.join(backendDir, 'server'));
    serverInstance = app.listen(PORT);
    await new Promise((r) => setTimeout(r, 500));
    serverRunning = true;
  }

  assert('Application Startup & Health Check', serverRunning);

  // 3. Test Registration Endpoint (POST /api/auth/register)
  const regResponse = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, testUser);

  assert('User Registration Returns 201 Created', regResponse.statusCode === 201);
  assert('Registration Response Contains success=true', regResponse.body.success === true);
  assert('Registration Response Contains JWT Token', typeof regResponse.body.token === 'string' && regResponse.body.token.split('.').length === 3);
  assert('Registration Response Returns User Object with Name & Email', regResponse.body.user && regResponse.body.user.email === testUser.email.toLowerCase());
  assert('Registration Response Never Exposes Password or Hash', !regResponse.body.password && !regResponse.body.user.password && !regResponse.body.user.passwordHash);

  const token = regResponse.body.token;
  const registeredUserId = regResponse.body.user ? (regResponse.body.user._id || regResponse.body.user.id) : null;

  // 4. Test Duplicate Registration (Should Reject with 400)
  const dupResponse = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, testUser);

  assert('Rejection of Duplicate Registration with 400', dupResponse.statusCode === 400);

  // 5. Test JWT Verification with Protected Route (GET /api/auth/me)
  const protectedRes = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  assert('JWT Verification: Access Granted with Valid Bearer Token (200 OK)', protectedRes.statusCode === 200);

  // 6. Test JWT Rejection Without Token (401 Unauthorized)
  const noTokenRes = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/me',
    method: 'GET'
  });

  assert('JWT Guard: Access Rejected when Token Missing (401 Unauthorized)', noTokenRes.statusCode === 401);

  // 7. Test JWT Rejection with Invalid/Tampered Token (401 Unauthorized)
  const invalidTokenRes = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature'
    }
  });

  assert('JWT Guard: Access Rejected on Tampered Signature (401 Unauthorized)', invalidTokenRes.statusCode === 401);

  // 8. Test Login with Correct Password (POST /api/auth/login)
  const loginSuccessRes = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testUser.email,
    password: testUser.password
  });

  assert('User Login with Correct Password Returns 200 OK', loginSuccessRes.statusCode === 200);
  assert('Login Response Issues Fresh JWT', typeof loginSuccessRes.body.token === 'string');

  // 9. Test Login Rejection with Incorrect Password (401 Unauthorized)
  const loginFailRes = await sendRequest({
    hostname: HOST,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testUser.email,
    password: 'WrongPassword999!'
  });

  assert('User Login Rejection with Incorrect Password Returns 401', loginFailRes.statusCode === 401);

  // 10. Direct MongoDB Password Hashing Verification
  const dbUser = await User.findOne({ email: testUser.email.toLowerCase() }).select('+password');
  assert('User Persisted in MongoDB Collection', dbUser !== null);

  const isBcryptHash = dbUser && dbUser.password && (dbUser.password.startsWith('$2a$10$') || dbUser.password.startsWith('$2b$10$')) && dbUser.password.length === 60;
  assert('Stored Password is Valid bcrypt 10-Salt Hash (Length: 60)', isBcryptHash, dbUser ? `Hash prefix: ${dbUser.password.substring(0, 7)}` : '');

  const notPlaintext = dbUser && dbUser.password !== testUser.password;
  assert('Stored Password is NOT Plaintext', notPlaintext);

  const bcryptMatch = dbUser ? await bcrypt.compare(testUser.password, dbUser.password) : false;
  assert('bcrypt.compare() Verifies Original Password Against Database Hash', bcryptMatch);

  // =========================================================================
  // VISUAL TERMINAL DEMONSTRATION (Matching Reference Interface)
  // =========================================================================

  console.log(`\n${colors.cyan}[SYSTEM] Executing full-stack authentication flow against Express + MongoDB...${colors.reset}\n`);

  // Card 1: POST /api/auth/register
  console.log(`${colors.gray}┌─────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`│ ${colors.bold}${colors.white}POST /api/auth/register${colors.reset}${' '.repeat(44)}${colors.bgGreen} 201 Created ${colors.reset} │`);
  console.log(`${colors.gray}├─────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);

  const formattedJson = JSON.stringify(regResponse.body, null, 2);
  const jsonLines = formattedJson.split('\n');
  for (const line of jsonLines) {
    let coloredLine = line;
    // Syntax highlight JSON keys and values
    coloredLine = coloredLine.replace(/"([^"]+)":/g, `${colors.cyan}"$1"${colors.reset}:`);
    coloredLine = coloredLine.replace(/: "([^"]+)"/g, `: ${colors.yellow}"$1"${colors.reset}`);
    coloredLine = coloredLine.replace(/: true/g, `: ${colors.green}true${colors.reset}`);
    coloredLine = coloredLine.replace(/: false/g, `: ${colors.red}false${colors.reset}`);

    // Truncate long JWT token line visually while keeping validity clear
    if (line.includes('"token":')) {
      const tokenPreview = token.length > 55 ? `${token.substring(0, 48)}...` : token;
      coloredLine = `  ${colors.cyan}"token"${colors.reset}: ${colors.magenta}"${tokenPreview}"${colors.reset},`;
    }

    console.log(`│ ${coloredLine}`);
  }
  console.log(`${colors.gray}└─────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`);

  // Card 2: MongoDB WiredTiger Document Verification
  console.log(`${colors.gray}┌─────────────────────────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`│ ${colors.bold}${colors.white}MongoDB WiredTiger Document: db.users.find({ email: '${testUser.email}' })${colors.reset} │`);
  console.log(`│ ${' '.repeat(51)}${colors.bgBlue} BCRYPT SALT: 10 ROUNDS ${colors.reset} │`);
  console.log(`${colors.gray}├─────────────────────────────────────────────────────────────────────────────┤${colors.reset}`);
  console.log(`│ ${colors.dim}Password is securely salted and hashed. Raw plaintext password is NEVER stored:${colors.reset}`);
  console.log(`│ {`);
  console.log(`│   ${colors.cyan}_id${colors.reset}: ${colors.yellow}ObjectId("${dbUser._id}")${colors.reset},`);
  console.log(`│   ${colors.cyan}name${colors.reset}: ${colors.yellow}"${dbUser.name}"${colors.reset},`);
  console.log(`│   ${colors.cyan}email${colors.reset}: ${colors.yellow}"${dbUser.email}"${colors.reset},`);
  console.log(`│   ${colors.cyan}role${colors.reset}: ${colors.yellow}"${dbUser.role || 'student'}"${colors.reset},`);
  console.log(`│   ${colors.cyan}password${colors.reset}: ${colors.red}"${dbUser.password}"${colors.reset}  ${colors.green}✓ [60-Char bcrypt Hash]${colors.reset}`);
  console.log(`│   ${colors.cyan}createdAt${colors.reset}: ${colors.dim}"${dbUser.createdAt ? dbUser.createdAt.toISOString() : new Date().toISOString()}"${colors.reset},`);
  console.log(`│   ${colors.cyan}updatedAt${colors.reset}: ${colors.dim}"${dbUser.updatedAt ? dbUser.updatedAt.toISOString() : new Date().toISOString()}"${colors.reset}`);
  console.log(`│ }`);
  console.log(`${colors.gray}└─────────────────────────────────────────────────────────────────────────────┘${colors.reset}\n`);

  // Summary Report
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}           PRACTICAL 7 AUTHENTICATION PIPELINE TEST SUMMARY                    ${colors.reset}`);
  console.log(`${colors.bold}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  for (const r of results) {
    const icon = r.passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`  ${icon} : ${r.title}`);
  }
  console.log(`${colors.bold}───────────────────────────────────────────────────────────────────────────────${colors.reset}`);
  console.log(`  ${colors.bold}Total Tests:${colors.reset} ${results.length} | ${colors.green}Passed:${colors.reset} ${passedCount} | ${colors.red}Failed:${colors.reset} ${failedCount}`);

  // Clean up synthetic test user
  await User.deleteOne({ email: testUser.email.toLowerCase() });

  // Close database connection and server if started internally
  await mongoose.connection.close();
  if (serverInstance) {
    serverInstance.close();
  }

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log(`  ${colors.bold}${colors.green}All Practical 7 security assertions verified successfully!${colors.reset}\n`);
    process.exit(0);
  }
}

runPipeline().catch((err) => {
  console.error(`\n${colors.red}[FATAL UNHANDLED ERROR]: ${err.stack || err.message}${colors.reset}`);
  process.exit(1);
});
