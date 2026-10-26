import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const dashboard=readFileSync(new URL('apps/web/app/my-sps/dashboard.tsx',root),'utf8');
const page=readFileSync(new URL('apps/web/app/my-sps/page.tsx',root),'utf8');
const service=readFileSync(new URL('apps/api/src/my-sps-service.ts',root),'utf8');
for(const [name,ok] of Object.entries({
 'sessions filtered to PUBLISHED':dashboard.includes("s.status==='PUBLISHED'"),
 'session empty state':dashboard.includes('No published sessions'),
 'session overview heading':dashboard.includes('Upcoming sessions'),
 'accessible session time':dashboard.includes('<time dateTime='),
 'dashboard no injected inner HTML':!dashboard.includes('dangerouslySetInnerHTML'),
 'dashboard no client identity':!dashboard.includes('personId:') && !dashboard.includes('personId='),
 'page no client role':!page.includes('x-user-role'),
 'page session bearer':page.includes('Authorization:`Bearer ${cookie}`'),
 'page SSR fetch no-store':page.includes("cache:'no-store'"),
 'api self-scope before SQL':service.indexOf('canReadOwnEnrollment')<service.indexOf('loadOwnEnrollments(db'),
 'api forbidden state':service.includes('status:403'),
 'session no raw data in page query':!page.includes('personId='),
}))assert.ok(ok,name);
console.log('PASS CP024 12/12 contract checks; session API composition pending runtime');
