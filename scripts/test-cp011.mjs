import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const session=read('../apps/api/src/session-service.ts');
const controller=read('../apps/api/src/main.ts');
const page=read('../apps/web/app/my-sps/page.tsx');
const bff=read('../apps/web/app/api/my-sps/route.ts');
const checks=[
 ['require explicit server-side role',session.includes('session.activeRoleCode') && session.includes('if (!chosen) return null')],
 ['no implicit privilege selection',!session.includes('?? enabled[0]') && session.includes('matches.length===0')],
 ['hash opaque session',session.includes("createHash('sha256')")],
 ['expired sessions rejected',session.includes('session.expiresAt.getTime()<=now.getTime()')],
 ['revoked sessions rejected',session.includes('session.revokedAt!==null')],
 ['controller uses repository',controller.includes('new PgSessionRepository(connection)')],
 ['controller does not import HMAC prototype',!controller.includes("from './session'" )],
 ['BFF reads cookie server side',bff.includes("cookies()")],
 ['BFF no Host header SSRF',!bff.includes("headers()")],
 ['page no Host header SSRF',!page.includes("h.get('host')")],
 ['page uses trusted URL',page.includes("process.env.SPS_INTERNAL_API_URL")],
 ['BFF rejects invalid API URL',bff.includes("url.username||url.password")],
 ['BFF never shares token in JSON',!bff.includes('token:token')],
 ['request cache bypassed',bff.includes("cache:'no-store'")],
 ['no database configuration leak in health',!controller.includes('dbConfigured:')]
];
for(const [name,pass] of checks){assert.ok(pass,name);console.log('PASS',name)}
console.log(`${checks.length}/${checks.length} CP-011 source assertions PASS`)
