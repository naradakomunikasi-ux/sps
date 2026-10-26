import assert from 'node:assert/strict';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../apps/api/src/security.ts',import.meta.url),'utf8');
const sql=fs.readFileSync(new URL('../db/migrations/001_initial.sql',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../apps/api/src/main.ts',import.meta.url),'utf8');
const checks=[
 ['default-deny missing principal', /if \(!ctx \|\| !ctx\.personId/.test(code)],
 ['explicit role grants', /const grants|permissionBundles/.test(code)],
 ['self-person scoping', /ctx\.personId\s*===\s*resource\.personId/.test(code)],
 ['batch scope enforced', /ctx\.batchIds\.includes\(resource\.batchId\)/.test(code)],
 ['unauthenticated request denied', /UnauthorizedException/.test(api)],
 ['untrusted headers excluded', !/req\.headers\[['"]x-(user|role)/i.test(api)],
 ['person account uniqueness', /person_id uuid NOT NULL UNIQUE/.test(sql)],
 ['enrollment uniqueness', /UNIQUE\(person_id,batch_id\)/.test(sql)],
 ['attendance uniqueness', /UNIQUE\(enrollment_id,session_id\)/.test(sql)],
 ['audit correlation', /correlation_id text NOT NULL/.test(sql)]
];
for(const [name,pass] of checks){assert.equal(pass,true,name);console.log('PASS',name)}
console.log(`${checks.length}/${checks.length} source-contract assertions PASS; NOT runtime authorization tests`);
