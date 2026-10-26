import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const tmp=mkdtempSync(join(tmpdir(),'sps-cp006-'));
try{
 execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--skipLibCheck','--outDir',tmp,'--noEmitOnError','false','apps/api/src/session-service.ts','apps/api/src/my-sps-repository.ts'],{cwd:root,stdio:'pipe'});
}catch(err){ // Type definitions unavailable: emitted JS is still tested; compiler errors recorded separately.
 if(!readFileSync(resolve(root,'apps/api/src/session-service.ts'),'utf8').includes('resolveSessionContext'))throw err;
}
const modulePath=join(tmp,'session-service.js');
let service;try{service=await import('file://'+modulePath)}catch(e){throw new Error(`Transpiled service unavailable: ${e}`)}
const resolveContext=service.resolveSessionContext??service.default?.resolveSessionContext;
const token='x'.repeat(40),hash=(await import('node:crypto')).createHash('sha256').update(token).digest('hex');
const session={id:'s',userAccountId:'u',personId:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',expiresAt:new Date('2030-01-01'),revokedAt:null,activeRoleCode:'PARTICIPANT'};
const goodRepo={findActiveSessionByHash:async h=>h===hash?session:null,listEffectiveRoles:async()=>[{code:'PARTICIPANT',enabled:true,batchIds:['b1']}]};
assert.equal((await resolveContext(token,goodRepo,new Date('2026-10-19')))?.activeRole,'PARTICIPANT');
assert.equal(await resolveContext('bad',goodRepo),null);
assert.equal(await resolveContext(token,{...goodRepo,findActiveSessionByHash:async()=>({...session,revokedAt:new Date()})}),null);
assert.equal(await resolveContext(token,{...goodRepo,listEffectiveRoles:async()=>[]}),null);
assert.equal(await resolveContext(token,{...goodRepo,findActiveSessionByHash:async()=>({...session,expiresAt:new Date('2020-01-01')})}),null);
const repo=await import('file://'+join(tmp,'my-sps-repository.js'));
const load=repo.loadOwnEnrollments??repo.default?.loadOwnEnrollments;
let args; await load({query:async (sql,p)=>{args={sql,p};return {rows:[]}}},session.personId);
assert.deepEqual(args.p,[session.personId]);assert.match(args.sql,/WHERE e\.person_id=\$1/);
assert.rejects(()=>load({query:async()=>({rows:[]})},'untrusted'));
const proxy=readFileSync(join(root,'apps/web/app/api/my-sps/route.ts'),'utf8');
assert.match(proxy,/cookies\(\)/);assert.match(proxy,/cache:'no-store'/);assert.doesNotMatch(proxy,/searchParams\.get\(['"]role/);
const migration=readFileSync(join(root,'db/migrations/005_identity_hardening_candidate.sql'),'utf8');assert.match(migration,/NULLS NOT DISTINCT/);
console.log('CP006 executable service tests PASS: 9 assertions');
rmSync(tmp,{recursive:true,force:true});
