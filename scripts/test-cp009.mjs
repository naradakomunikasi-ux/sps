import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text = (p) => readFileSync(new URL(p, import.meta.url),'utf8');
const main=text('../apps/api/src/main.ts');
const pkg=JSON.parse(text('../apps/api/package.json'));
const checks=[
  [!main.includes('verifySignedContext'), 'legacy HMAC prototype removed from controller'],
  [main.includes('resolveSessionContext'), 'database-backed resolver wired'],
  [main.includes('new PgSessionRepository(connection)'), 'PostgreSQL adapter wired'],
  [main.includes("@Get('enrollments')"), 'enrollment controller route'],
  [main.includes('getOwnEnrollments'), 'self-scope service integrated'],
  [main.includes('UnauthorizedException'), 'unauthenticated fail-closed'],
  [main.includes('ForbiddenException'), 'forbidden fail-closed'],
  [main.includes('ServiceUnavailableException'), 'database fail-closed'],
  [main.includes('DATABASE_URL'), 'database configured via environment'],
  [Boolean(pkg.dependencies.pg && pkg.devDependencies['@types/pg']), 'PostgreSQL package declarations'],
];
for(const [ok,reason] of checks)assert.ok(ok,reason);
console.log(`${checks.length}/${checks.length} CP009 source assertions PASS; not a PostgreSQL runtime test`);
