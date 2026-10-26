import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canReadOwnEnrollment,canReadAssignedSession,canManageBatchEnrollment,canReadScopedParticipant,canReadPtm,canReadBatchReport} from '../apps/api/src/authorization.ts';
const id='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const b='11111111-1111-4111-8111-111111111111',x='22222222-2222-4222-8222-222222222222';
const as=(activeRole)=>({personId:id,activeRole,batchIds:[b]});
const cases=[
 [null,()=>canReadOwnEnrollment(null,id),false],[null,()=>canReadOwnEnrollment(as('PARTICIPANT'),other),false],[null,()=>canReadOwnEnrollment(as('PARTICIPANT'),id),true],
 [null,()=>canReadAssignedSession(as('PARTICIPANT'),b),true],[null,()=>canReadAssignedSession(as('PARTICIPANT'),x),false],
 [null,()=>canManageBatchEnrollment(as('ADMIN'),b),true],[null,()=>canManageBatchEnrollment(as('ADMIN'),x),false],
 [null,()=>canManageBatchEnrollment(as('PARTICIPANT'),b),false],
 [null,()=>canReadScopedParticipant(as('ADMIN'),b),true],[null,()=>canReadScopedParticipant(as('ADMIN'),x),false],
 [null,()=>canReadPtm(as('FACILITATOR'),b),true],[null,()=>canReadPtm(as('PTM_COORDINATOR'),b),true],
 [null,()=>canReadPtm(as('FACILITATOR'),x),false],[null,()=>canReadPtm(as('PARTICIPANT'),b),false],
 [null,()=>canReadBatchReport(as('DIRECTOR'),b),true],[null,()=>canReadBatchReport(as('DIRECTOR'),x),false],
 [null,()=>canReadBatchReport(as('ADMIN'),b),false]];
for (const [_,fn,result] of cases)assert.equal(fn(),result);
const dash=readFileSync(new URL('../apps/web/app/my-sps/dashboard.tsx',import.meta.url),'utf8');
const page=readFileSync(new URL('../apps/web/app/my-sps/page.tsx',import.meta.url),'utf8');
for (const term of ['aria-label="My SPS overview"','grid-template-columns:repeat(auto-fit','My SPS journeys','Active batches'])assert.ok(dash.includes(term),term);
for (const term of ["state==='FORBIDDEN'","<EnrollmentDashboard items={items}/>","href=\"/my-sps\""])assert.ok(page.includes(term),term);
console.log('PASS: 17 real authorization behavior assertions, 7 frontend source contract checks');
