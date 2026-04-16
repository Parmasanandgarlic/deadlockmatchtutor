/**
 * Static Application Security Testing (SAST)
 * Lightweight source-code scanner for common vulnerabilities & hardcoded secrets.
 *
 * Rules:
 *   1. Hardcoded secrets (API keys, JWTs, DB URIs with passwords)
 *   2. SQL injection sinks (string-concat SQL)
 *   3. Command injection (child_process exec with interpolated input)
 *   4. Path traversal (fs.* with unvalidated user input)
 *   5. eval / Function constructor usage
 *   6. .env leaks in version control (committed .env files)
 *   7. Missing helmet / CORS / rate-limit
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const IGNORED = ['node_modules', 'dist', '.git', 'deadlock_api_client', 'temp', 'temp-openapi', 'tests'];
const SOURCE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const findings = [];

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const ent of entries) {
    if (IGNORED.includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (SOURCE_EXTS.has(path.extname(ent.name))) scan(full);
  }
}

const RULES = [
  {
    id: 'SAST-001',
    desc: 'Hardcoded Supabase/JWT secret',
    severity: 'HIGH',
    regex: /eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{5,}/,
  },
  {
    id: 'SAST-002',
    desc: 'Hardcoded Steam API key',
    severity: 'HIGH',
    regex: /[A-F0-9]{32}/i,
    predicate: (line) => /steam|api[-_]?key/i.test(line),
  },
  {
    id: 'SAST-003',
    desc: 'Postgres connection string with inline password',
    severity: 'HIGH',
    regex: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/i,
  },
  {
    id: 'SAST-004',
    desc: 'Use of eval() / Function constructor',
    severity: 'HIGH',
    regex: /\beval\s*\(|new\s+Function\s*\(/,
  },
  {
    id: 'SAST-005',
    desc: 'child_process.exec with interpolation (possible command injection)',
    severity: 'HIGH',
    regex: /child_process[\s\S]{0,40}\.exec\s*\(\s*`[^`]*\$\{/,
  },
  {
    id: 'SAST-006',
    desc: 'SQL string concatenation (possible SQL injection)',
    severity: 'MEDIUM',
    regex: /query\s*\(\s*['"`].*(?:SELECT|INSERT|UPDATE|DELETE).*['"`]\s*\+/i,
  },
  {
    id: 'SAST-007',
    desc: 'fs.* call with direct req.body/req.params/req.query (possible path traversal)',
    severity: 'MEDIUM',
    regex: /fs\.(?:readFile|writeFile|readFileSync|writeFileSync|unlink|unlinkSync|createReadStream|createWriteStream)\s*\([^)]*req\.(?:body|params|query)/,
  },
  {
    id: 'SAST-008',
    desc: 'console.log of req.body / req.headers (possible PII leak)',
    severity: 'LOW',
    regex: /console\.log\s*\([^)]*req\.(?:body|headers|cookies)/,
  },
];

function scan(file) {
  const rel = path.relative(ROOT, file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.regex.test(line)) {
        if (rule.predicate && !rule.predicate(line)) continue;
        // Ignore obvious safe patterns
        if (/\/\/\s*sast-ignore/i.test(line)) continue;
        findings.push({
          id: rule.id,
          severity: rule.severity,
          desc: rule.desc,
          file: rel,
          line: i + 1,
          match: line.trim().slice(0, 140),
        });
      }
    }
  });
}

function checkEnvCommitted() {
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  if (!/\.env/m.test(gitignore)) {
    findings.push({
      id: 'SAST-009', severity: 'HIGH',
      desc: '.env not present in .gitignore',
      file: '.gitignore', line: 0, match: '',
    });
  }
}

function checkSecurityMiddleware() {
  const idx = fs.readFileSync(path.join(ROOT, 'server', 'index.js'), 'utf8');
  const required = ['helmet', 'cors', 'rate-limit', 'express-rate-limit'];
  const missing = [];
  if (!/helmet\(/.test(idx)) missing.push('helmet');
  if (!/cors\(/.test(idx)) missing.push('cors');
  if (!/rateLimit\(|rate-limit/.test(idx)) missing.push('rateLimit');
  if (missing.length) {
    findings.push({
      id: 'SAST-010', severity: 'MEDIUM',
      desc: `Missing security middleware: ${missing.join(', ')}`,
      file: 'server/index.js', line: 0, match: '',
    });
  }
}

console.log('\n[SAST] Static Application Security Scan');
walk(ROOT);
checkEnvCommitted();
checkSecurityMiddleware();

const bySeverity = findings.reduce((acc, f) => {
  acc[f.severity] = (acc[f.severity] || 0) + 1;
  return acc;
}, {});

if (findings.length === 0) {
  console.log('  PASS  No vulnerabilities detected.');
} else {
  for (const f of findings) {
    console.log(`  [${f.severity}] ${f.id} ${f.file}:${f.line} - ${f.desc}`);
    if (f.match) console.log(`        ${f.match}`);
  }
  console.log(`\n  Summary: HIGH=${bySeverity.HIGH || 0} MEDIUM=${bySeverity.MEDIUM || 0} LOW=${bySeverity.LOW || 0}`);
}

if ((bySeverity.HIGH || 0) > 0) process.exitCode = 1;
