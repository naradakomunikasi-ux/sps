import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('apps/api/src/main.ts'),auth=read('apps/api/src/security.ts'),req=read('apps/api/src/requests.ts'),domain=read('apps/api/src/domain.ts'),web=read('apps/web/app/my-sps/page.tsx'),sql=read('db/migrations/002_workflow_foundation.sql');
const cases={
 'trusted session only':!api.includes('req.headers[')&&api.includes('verifySignedContext'),
 'default deny':auth.includes('if (!ctx ||'),
 'self resource scope':auth.includes('ctx.personId === resource.personId'),
 'batch resource scope':auth.includes('ctx.batchIds.includes(resource.batchId)'),
 'workflow validates permission':req.includes("'enrollment.manage.scoped'"),
 'workflow validates transition':req.includes('canTransition('),
 'workflow validates idempotency':req.includes('requireIdempotencyKey('),
 'terminal states':domain.includes('WITHDRAWN: []')&&domain.includes('COMPLETED: []'),
 'workflow optimistic version':sql.includes('version integer NOT NULL DEFAULT 0'),
 'idempotency unique constraint':sql.includes('UNIQUE(actor_person_id,operation,idempotency_key)'),
 'transition audit linkage':sql.includes('REFERENCES workflow_case(id)'),
 'participant requires sign in':web.includes('Sign-in required'),
 'no synthetic participant identity':!web.includes('samplePerson') && !web.includes('demo@example'),
 'frontend error state':read('apps/web/app/my-sps/error.tsx').includes('role="alert"'),
 'frontend loading state':read('apps/web/app/my-sps/loading.tsx').includes('aria-live="polite"')
};
let fails=0;for(const [name,ok] of Object.entries(cases)){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok) fails++}console.log(`TOTAL ${Object.keys(cases).length-fails}/${Object.keys(cases).length}`);process.exitCode=fails?1:0;
