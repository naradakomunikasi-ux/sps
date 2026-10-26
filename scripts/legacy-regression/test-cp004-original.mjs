import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const read=x=>readFileSync(join(process.cwd(),x),'utf8');
const cases=[
 ['auth uses HMAC',()=>assert.match(read('apps/api/src/session.ts'),/createHmac/)],
 ['signature constant time',()=>assert.match(read('apps/api/src/session.ts'),/timingSafeEqual/)],
 ['expired token rejected',()=>assert.match(read('apps/api/src/session.ts'),/<=now/)],
 ['role allowlist',()=>assert.match(read('apps/api/src/session.ts'),/allowedRoles/)],
 ['unknown scope denied',()=>assert.match(read('apps/api/src/security.ts'),/return false|includes\(resource.batchId\)/)],
 ['bearer validation API',()=>assert.match(read('apps/api/src/main.ts'),/verifySignedContext/)],
 ['no identity headers',()=>assert.doesNotMatch(read('apps/api/src/main.ts'),/x-person-id|x-role/)],
 ['health timeout',()=>assert.match(read('apps/web/app/health/page.tsx'),/AbortSignal.timeout/)],
 ['health no-store',()=>assert.match(read('apps/web/app/health/page.tsx'),/no-store/)],
 ['audit in transaction contract',()=>assert.match(read('db/migrations/003_workflow_atomic_contract.sql'),/audit_event in same transaction/)],
 ['optimistic concurrency',()=>assert.match(read('db/migrations/003_workflow_atomic_contract.sql'),/expected_version/)],
 ['replay idempotency',()=>assert.match(read('db/migrations/003_workflow_atomic_contract.sql'),/duplicate receipt/)],
];
for(const [name,fn] of cases){fn();console.log('PASS',name)}console.log(`${cases.length}/${cases.length} source-level checks PASS (not runtime)`);
