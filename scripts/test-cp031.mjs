import assert from 'node:assert/strict';
import {executeIdempotent,IdempotencyConflict,hashIdempotentRequest} from '../apps/api/src/idempotency.ts';
const actor='11111111-1111-4111-8111-111111111111',hash=hashIdempotentRequest('POST','/v1/enrollment',{batch:'a'});
let assertions=0;const ok=(v)=>{assert.ok(v);assertions++};
class FakePool {
 constructor(){this.table=new Map();this.actions=0;this.rollbacks=0;this.releases=0}
 async connect(){const self=this;let pending=null;return {release(){self.releases++},async query(sql,args=[]){
 if(sql==='BEGIN')return {rows:[]};
 if(sql==='ROLLBACK'){self.rollbacks++;pending=null;return {rows:[]}};
 if(sql==='COMMIT'){if(pending)self.table.set(pending.k,pending.record);return {rows:[]}};
 const k=`${args[0]}:${args[1]}`;
 if(sql.startsWith('INSERT INTO sps_idempotency')){if(!self.table.has(k)){pending={k,record:{request_hash:args[2],status:'PROCESSING',http_status:null,response_body:null}}}return {rows:[]}}
 if(sql.startsWith('SELECT request_hash'))return {rows:[pending?.record??self.table.get(k)].filter(Boolean)};
 if(sql.startsWith('UPDATE sps_idempotency')){pending={k,record:{request_hash:hash,status:'COMPLETED',http_status:args[2],response_body:JSON.parse(args[3])}};return {rows:[]}};
 self.actions++;return {rows:[]};
 }} }
}
const p=new FakePool();let calls=0;const action=async tx=>{calls++;await tx.query('UPDATE enrollment SET status=$1',['ACTIVE']);return {httpStatus:201,body:{id:'123'}}};
let r=await executeIdempotent(p,actor,'key_000001',hash,action);ok(!r.replayed);ok(r.outcome.httpStatus===201);ok(calls===1);
r=await executeIdempotent(p,actor,'key_000001',hash,action);ok(r.replayed);ok(calls===1);ok(r.outcome.body.id==='123');
await assert.rejects(()=>executeIdempotent(p,actor,'key_000001','a'.repeat(64),action),IdempotencyConflict);assertions++;
await assert.rejects(()=>executeIdempotent(p,actor,'short',hash,action));assertions++;
await assert.rejects(()=>executeIdempotent(p,'bad','key_000002',hash,action));assertions++;
await assert.rejects(()=>executeIdempotent(p,actor,'key_000002','bad',action));assertions++;
await assert.rejects(()=>executeIdempotent(p,actor,'key_000002',hash,async()=>{throw new Error('business transaction failed')}));assertions++;
ok(!p.table.has(`${actor}:key_000002`));ok(p.releases===4);ok(p.rollbacks===2);
assert.throws(()=>hashIdempotentRequest('GET','/v1/enrollment',{}));assertions++;
assert.throws(()=>hashIdempotentRequest('POST','/v1/enrollment?x=1',{}));assertions++;
console.log('PASS',assertions,'CP031 local idempotency assertions; PostgreSQL runtime NOT RUN');
