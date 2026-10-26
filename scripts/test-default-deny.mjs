import assert from 'node:assert/strict';
import { authorize } from '../apps/api/src/security.ts';
const person='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const batch='33333333-3333-4333-8333-333333333333';
const alien='44444444-4444-4444-8444-444444444444';
const student={personId:person,activeRole:'PARTICIPANT',batchIds:[batch]};
const cases=[
 ['deny null session',null,'profile.read.self',{personId:person},false],
 ['deny unknown permission',student,'user.admin',{personId:person},false],
 ['allow own profile',student,'profile.read.self',{personId:person},true],
 ['deny other person',student,'profile.read.self',{personId:other},false],
 ['deny missing person ID',student,'profile.read.self',{},false],
 ['allow own enrollment',student,'enrollment.read.self',{personId:person},true],
 ['deny other enrollment',student,'enrollment.read.self',{personId:other},false],
 ['allow assigned session',student,'session.read.assigned',{batchId:batch},true],
 ['deny cross batch',student,'session.read.assigned',{batchId:alien},false],
 ['deny missing batch',student,'session.read.assigned',{},false],
 ['deny wrong role',student,'participant.read.scoped',{batchId:batch},false],
 ['allow admin own batch',{...student,activeRole:'ADMIN'},'participant.read.scoped',{batchId:batch},true],
 ['deny admin other batch',{...student,activeRole:'ADMIN'},'participant.read.scoped',{batchId:alien},false],
 ['deny role injection',{...student,activeRole:'SUPER_ADMIN'},'profile.read.self',{personId:person},false],
 ['deny empty scope',{...student,batchIds:[]},'session.read.assigned',{batchId:batch},false],
 ['deny null person',{...student,personId:''},'profile.read.self',{personId:''},false],
 ['deny facilitator enrollment',{...student,activeRole:'FACILITATOR'},'enrollment.read.self',{personId:person},false],
 ['deny director participant read',{...student,activeRole:'DIRECTOR'},'participant.read.scoped',{batchId:batch},false],
];
for(const [name,ctx,permission,resource,expect] of cases){ assert.equal(authorize(ctx,permission,resource),expect,name); }
console.log(`PASS ${cases.length}/${cases.length} behavior assertions; Node TS stripping; no mocks of authorize()`);
