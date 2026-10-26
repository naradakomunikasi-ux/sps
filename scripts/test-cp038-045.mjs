import assert from 'node:assert/strict';
import { parseRoleContextRequest } from '../apps/api/src/role-context-request.ts';
const token='Req_0987654321';
let count=0;
for(const role of ['PARTICIPANT','FACILITATOR','PTM_COORDINATOR','ADMIN','DIRECTOR']) {assert.equal(parseRoleContextRequest({role},token)?.role,role);count++}
for(const value of [null,{},[],{role:'ADMIN',personId:'spoof'},{role:'ROOT'},{role:null},'ADMIN']) {assert.equal(parseRoleContextRequest(value,token),null);count++}
for(const cid of ['', 'x', 'bad id', 'x'.repeat(129), null, {}, 'hello\nworld']) {assert.equal(parseRoleContextRequest({role:'ADMIN'},cid),null);count++}
console.log('CP038-045 role context validation '+count+'/'+count+' PASS');
