import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('apps/api/src/main.ts');
const bff=read('apps/web/app/api/my-sps/route.ts');
const repo=read('apps/api/src/postgres-repositories.ts');
const sql=read('db/migrations/007_active_role_context_candidate.sql');
const checks=[
 ['backend token constrained',()=>assert.ok(api.includes('Bearer [A-Za-z0-9_-]{32,128}'))],
 ['backend resolves persisted session',()=>assert.match(api,/resolveSessionContext/)],
 ['backend does not use HMAC prototype',()=>assert.doesNotMatch(api,/verifyHmac|createHmac|SPS_AUTH_HMAC_SECRET/)],
 ['backend service refuses unavailable DB',()=>assert.match(api,/ServiceUnavailableException/)],
 ['backend self-scoped enrollment',()=>assert.match(api,/getOwnEnrollments/)],
 ['BFF no-store',()=>assert.match(bff,/no-store/)],
 ['BFF avoids request host SSRF',()=>assert.doesNotMatch(bff,/headers\(\).*host|request\.headers\.get\(['"]host/)],
 ['DB persisted role context candidate',()=>assert.match(sql,/active_role/i)],
 ['Postgres parameterized query',()=>assert.match(repo,/\$1/)],
 ['No real secrets committed',()=>assert.ok(!existsSync(new URL('../.env',import.meta.url)))],
];
let failed=0;for(const [name,fn] of checks){try{fn();console.log('PASS '+name)}catch(e){failed++;console.error('FAIL '+name+': '+e.message)}}console.log(JSON.stringify({total:checks.length,passed:checks.length-failed,failed}));if(failed)process.exitCode=1;
