import assert from 'node:assert/strict';
import {authorize,permissionBundles} from '../apps/api/src/security.ts';
const roles=Object.keys(permissionBundles);
const permissions=[...new Set(Object.values(permissionBundles).flat())];
const personA='11111111-1111-4111-8111-111111111111';
const personB='22222222-2222-4222-8222-222222222222';
const batchA='33333333-3333-4333-8333-333333333333';
const batchB='44444444-4444-4444-8444-444444444444';
const self=new Set(['profile.read.self','enrollment.read.self']);
let count=0;
const test=(label,ctx,permission,resource,expected)=>{assert.equal(authorize(ctx,permission,resource),expected,label);count++};
for(const role of roles){
 const ctx={personId:personA,activeRole:role,batchIds:[batchA]};
 for(const permission of permissions){
  const permitted=permissionBundles[role].includes(permission);
  const own=self.has(permission);
  test(`${role} ${permission} allowed`,ctx,permission,own?{personId:personA}:{batchId:batchA},permitted);
  test(`${role} ${permission} cross-scope denied`,ctx,permission,own?{personId:personB}:{batchId:batchB},false);
  test(`${role} ${permission} missing-scope denied`,ctx,permission,{},false);
 }
}
for(const role of roles){let ctx={personId:personA,activeRole:role,batchIds:[]};for(const permission of permissions.filter(p=>!self.has(p)))test(`${role} no batch ${permission}`,ctx,permission,{batchId:batchA},false)}
for(const permission of permissions){test(`anonymous ${permission}`,null,permission,{personId:personA,batchId:batchA},false);test(`fake role ${permission}`,{personId:personA,activeRole:'INJECTED_ADMIN',batchIds:[batchA]},permission,{personId:personA,batchId:batchA},false)}
for(const role of roles){const ctx={personId:personA,activeRole:role,batchIds:[batchA]};test(`${role} unregistered permission`,ctx,'*',{personId:personA,batchId:batchA},false);}
console.log(`PASS ${count}/${count} RBAC matrix assertions (local function tests, not HTTP E2E)`);
