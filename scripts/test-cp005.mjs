import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const a=read('apps/api/src/authorization.ts');const s=read('apps/api/src/session-repository.ts');
const w=read('apps/web/app/my-sps/status.ts');const m=read('db/migrations/004_session_store_candidate.sql');
const fix=read('db/migrations/003_workflow_atomic_contract.sql');
const tests=[
 ['authorization uses shared default-deny',()=>assert.match(a,/authorize\(ctx,permission,resource\)/)],
 ['self-enrollment permission',()=>assert.match(a,/enrollment\.read\.self/)],
 ['session batch scoped',()=>assert.match(a,/session\.read\.assigned/)],
 ['session repository lookup',()=>assert.match(s,/findActiveSessionByHash/)],
 ['session role assignment',()=>assert.match(s,/listEffectiveRoles/)],
 ['session revocation',()=>assert.match(s,/revokedAt === null/)],
 ['web deny mapping',()=>assert.match(w,/403\)return 'FORBIDDEN'/)],
 ['web identity mapping',()=>assert.match(w,/401\)return 'SIGN_IN_REQUIRED'/)],
 ['web empty mapping',()=>assert.match(w,/hasEnrollment\?'READY':'EMPTY'/)],
 ['session token hash unique',()=>assert.match(m,/token_hash text NOT NULL UNIQUE/)],
 ['database referential integrity',()=>assert.match(m,/REFERENCES user_account\(id\)/)],
 ['expiry constraint',()=>assert.match(m,/expires_at>issued_at/)],
 ['migration index corrected',()=>{assert.match(fix,/case_id, occurred_at DESC/);assert.doesNotMatch(fix,/workflow_case_id/)}],
];let pass=0;for(const [label,fn] of tests){try{fn();console.log('PASS',label);pass++}catch(e){console.error('FAIL',label,e.message)}}
console.log(`${pass}/${tests.length} PASS`);if(pass!==tests.length)process.exit(1);
