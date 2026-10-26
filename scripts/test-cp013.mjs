import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const r=read('../apps/api/src/session-service.ts');
const main=read('../apps/api/src/main.ts');
const proxy=read('../apps/web/app/api/my-sps/route.ts');
const checks=[
 ['role code comes from trusted session', r.includes('session.activeRoleCode')],
 ['empty active role denied', r.includes('if (!chosen) return null')],
 ['stale role denied', r.includes('if (matches.length===0) return null')],
 ['revocation denied', r.includes('session.revokedAt!==null')],
 ['expiry denied', r.includes('session.expiresAt.getTime()<=now.getTime()')],
 ['opaque token hashed',r.includes("createHash('sha256')")],
 ['no client role accepted by controller',!main.includes("@Headers('x-role')")],
 ['SQL-backed repository attached',main.includes('new PgSessionRepository(connection)')],
 ['BFF uses httpOnly server cookie',proxy.includes('cookies()')],
 ['BFF does not trust inbound Host',!proxy.includes('headers()')],
 ['BFF disables cache',proxy.includes("cache:'no-store'")],
 ['BFF disallows URL userinfo',proxy.includes('url.username||url.password')]
];
for(const [name,pass] of checks){assert.equal(pass,true,name);console.log('PASS',name)}
console.log(`${checks.length}/${checks.length} CP013 static security assertions PASS; NOT a runtime test`);
