import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const root=JSON.parse(read('package.json')); const api=JSON.parse(read('apps/api/package.json')); const web=JSON.parse(read('apps/web/package.json'));
const checks={root_manifest:root.private===true&&root.workspaces?.includes('apps/*'),node_engine:Number(root.engines?.node?.match(/\d+/)?.[0])>=20,start_contract:!!root.scripts.start&&!!root.scripts.build,api_start:!!api.scripts.start&&!!api.scripts.build,web_start:!!web.scripts.start&&!!web.scripts.build,postgres_authority:/DATABASE_URL=postgresql/.test(read('.env.example'))&&!/better-sqlite3/.test(JSON.stringify(api.dependencies)),port_contract:/process\.env\.PORT/.test(read('apps/api/src/main.ts')),docs:existsSync(new URL('../docs/HOSTINGER_SPS_DEPLOYMENT.md',import.meta.url))};
for(const [k,v] of Object.entries(checks))console.log(`${v?'PASS':'FAIL'} ${k}`);assert.ok(Object.values(checks).every(Boolean),'Hostinger preflight failed');console.log('SOURCE PREFLIGHT ONLY — deployment not proven.');
