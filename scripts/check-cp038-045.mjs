import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('..',import.meta.url);const read=(p)=>fs.readFileSync(new URL(p,root),'utf8');
assert.match(read('apps/api/src/main.ts'),/parseRoleContextRequest\(payload, correlationId\)/);
assert.match(read('apps/api/src/main.ts'),/changeOwnActiveRole\(db\(\), token, request.role, request.correlationId\)/);
assert.match(read('apps/api/src/zoom-evidence-inbox.ts'),/role_code='ADMIN'/);
assert.match(read('apps/api/src/zoom-evidence-inbox.ts'),/attendanceMutated:false/);
assert.match(read('docs/CP038_045_SEVEN_LANE_PLAN.md'),/GitHub push is explicitly on hold/);
console.log('CP038-045 static contract checks PASS');
