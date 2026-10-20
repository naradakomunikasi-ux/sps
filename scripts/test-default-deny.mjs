import assert from 'node:assert/strict';
import { authorize } from '../apps/api/src/security.ts';
const p='11111111-1111-4111-8111-111111111111', q='22222222-2222-4222-8222-222222222222';
const b='33333333-3333-4333-8333-333333333333', x='44444444-4444-4444-8444-444444444444';
const user={personId:p,activeRole:'PARTICIPANT',batchIds:[b]};
const cases=[
['null session',null,'profile.read.self',{personId:p},false],
['unknown permission',user,'user.admin',{personId:p},false],
['own profile',user,'profile.read.self',{personId:p},true],
['cross person',user,'profile.read.self',{personId:q},false],
['missing person ID',user,'profile.read.self',{},false],
['own enrollment',user,'enrollment.read.self',{personId:p},true],
['other enrollment',user,'enrollment.read.self',{personId:q},false],
['assigned session',user,'session.read.assigned',{batchId:b},true],
['cross batch',user,'session.read.assigned',{batchId:x},false],
['missing batch',user,'session.read.assigned',{},false],
['role mismatch',user,'participant.read.scoped',{batchId:b},false],
['admin own batch',{...user,activeRole:'ADMIN'},'participant.read.scoped',{batchId:b},true],
['admin other batch',{...user,activeRole:'ADMIN'},'participant.read.scoped',{batchId:x},false],
['unknown role',{...user,activeRole:'SUPER_ADMIN'},'profile.read.self',{personId:p},false],
['empty scope',{...user,batchIds:[]},'session.read.assigned',{batchId:b},false],
['empty principal',{...user,personId:''},'profile.read.self',{personId:''},false],
['facilitator denied enrollment',{...user,activeRole:'FACILITATOR'},'enrollment.read.self',{personId:p},false],
['director denied participant read',{...user,activeRole:'DIRECTOR'},'participant.read.scoped',{batchId:b},false]
];
for(const [name,ctx,permission,resource,expected] of cases) assert.equal(authorize(ctx,permission,resource),expected,name);
console.log('PASS 18/18 actual authorize() assertions; no HTTP runtime claim');
