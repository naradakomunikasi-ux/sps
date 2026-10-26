import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root=JSON.parse(read('package.json'));
const api=JSON.parse(read('apps/api/package.json'));
const web=JSON.parse(read('apps/web/package.json'));
const env=read('.env.example');
const main=read('apps/api/src/main.ts');
const checks={
 root_manifest:root.private===true && root.workspaces?.includes('apps/*'),
 node_engine:Number(root.engines?.node?.match(/\d+/)?.[0])>=20,
 non_paid_scripts:!!root.scripts['check:hostinger'] && !existsSync(new URL('../.github/workflows/',import.meta.url)),
 start_contract:!!root.scripts.start && !!root.scripts.build,
 api_start:!!api.scripts.start && !!api.scripts.build,
 frontend_start:!!web.scripts.start && !!web.scripts.build,
 postgres_authority:/DATABASE_URL=postgresql/.test(env)&&!/better-sqlite3/.test(JSON.stringify(api.dependencies)),
 env_no_secret:/SPS_INTERNAL_API_URL=/.test(env)&&!/RM_APP_TOKEN/.test(env),
 port_contract:/process\.env\.PORT/.test(main),
 hostinger_docs:existsSync(new URL('../docs/HOSTINGER_SPS_DEPLOYMENT.md',import.meta.url)),
};
for(const [k,v] of Object.entries(checks))console.log(`${v?'PASS':'FAIL'} ${k}`);
assert.ok(Object.values(checks).every(Boolean),'Hostinger preflight failed');
console.log('SOURCE PREFLIGHT ONLY — no claim of Hostinger deployment or PostgreSQL runtime.');
