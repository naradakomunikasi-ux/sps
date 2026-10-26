import assert from 'node:assert/strict';
import {changeOwnActiveRole,RoleSwitchDenied} from '../apps/api/src/role-context-switch.ts';
const token='a'.repeat(40),person='11111111-1111-4111-8111-111111111111';
let checks=0;const ok=(v)=>{assert.ok(v);checks++};
function fake({expired=false,revoked=false,role=true,same=false,dbFail=false}={}) {
 const log=[];let releases=0;
 const pool={
  async connect(){
   return {
    release(){releases++},
    async query(sql,args=[]){
     log.push({sql,args});
     if(dbFail&&sql.startsWith('UPDATE'))throw Error('db down');
     if(sql.startsWith('SELECT s.id'))return {rows:expired||revoked?[]:[{id:'22222222-2222-4222-8222-222222222222',user_account_id:'33333333-3333-4333-8333-333333333333',person_id:person,active_role_code:same?'ADMIN':'PARTICIPANT'}]};
     if(sql.startsWith('SELECT DISTINCT'))return {rows:role?[{role_code:'ADMIN'}]:[]};
     return {rows:[]};
    }
   };
  }
 };
 return {pool,log,get releases(){return releases}};
}

const c=fake();const r=await changeOwnActiveRole(c.pool,token,'ADMIN','cp032_corr_0001');ok(r.activeRole==='ADMIN');ok(c.log.some(x=>x.sql.startsWith('UPDATE auth_session')));ok(c.log.some(x=>x.sql.includes('INSERT INTO audit_event')));ok(c.log.some(x=>x.sql==='COMMIT'));ok(c.releases===1);ok(!JSON.stringify(c.log).includes(token));
const s=fake({same:true});await changeOwnActiveRole(s.pool,token,'ADMIN','cp032_corr_0001');ok(!s.log.some(x=>x.sql.startsWith('UPDATE auth_session')));ok(!s.log.some(x=>x.sql.includes('INSERT INTO audit_event')));
for(const variant of [{expired:true},{revoked:true},{role:false}]){const f=fake(variant);await assert.rejects(()=>changeOwnActiveRole(f.pool,token,'ADMIN','cp032_corr_0001'),RoleSwitchDenied);checks++;ok(f.log.some(x=>x.sql==='ROLLBACK'));ok(!f.log.some(x=>x.sql==='COMMIT'))}
const down=fake({dbFail:true});await assert.rejects(()=>changeOwnActiveRole(down.pool,token,'ADMIN','cp032_corr_0001'),/unavailable/);checks++;ok(down.log.some(x=>x.sql==='ROLLBACK'));
for(const [t,role,corr] of [['short','ADMIN','cp032_corr_0001'],[token,'SUPER_ADMIN','cp032_corr_0001'],[token,'ADMIN','bad']]){const f=fake();await assert.rejects(()=>changeOwnActiveRole(f.pool,t,role,corr),RoleSwitchDenied);checks++;ok(f.log.length===0)}
console.log(`PASS ${checks} CP032 role switch behavior checks (fake DB, not real PostgreSQL)`);
