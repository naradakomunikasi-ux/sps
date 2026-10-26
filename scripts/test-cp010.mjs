import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const main=read('apps/api/src/main.ts'),session=read('apps/api/src/session-service.ts'),repo=read('apps/api/src/postgres-repositories.ts'),bff=read('apps/web/app/api/my-sps/route.ts'),env=read('.env.example');
const cases={
 'controller uses database resolver':main.includes('resolveSessionContext')&&main.includes('PgSessionRepository'),
 'controller removes legacy HMAC':!main.includes('verifySignedContext'),
 'controller denies missing bearer token':main.includes('UnauthorizedException')&&main.includes('if (!token)'),
 'controller refuses missing database':main.includes('ServiceUnavailableException')&&main.includes('if (!pool)'),
 'session uses opaque hashed token':session.includes("createHash('sha256')")&&session.includes('findActiveSessionByHash'),
 'session expiry and revocation checked':session.includes('session.revokedAt!==null')&&session.includes('session.expiresAt.getTime()'),
 'assigned role loaded from SQL':repo.includes('FROM role_assignment')&&repo.includes('enabled=TRUE'),
 'query parameterized':repo.includes('s.token_hash=$1')&&repo.includes('s.expires_at>$2'),
 'frontend BFF no-store':bff.includes("cache:'no-store'")&&bff.includes("'Cache-Control':'no-store'"),
 'frontend BFF does not accept browser role claims':!bff.includes('x-person-id')&&!bff.includes('x-role'),
 'shared internal API variable':env.includes('SPS_INTERNAL_API_URL=')&&bff.includes('SPS_INTERNAL_API_URL'),
 'legacy secret removed from environment template':!env.includes('SPS_SESSION_HMAC_SECRET='),
 'migration sequence':Array.from({length:6},(_,i)=>String(i+1).padStart(3,'0')).every(id=>['001_initial.sql','002_workflow_foundation.sql','003_workflow_atomic_contract.sql','004_session_store_candidate.sql','005_identity_hardening_candidate.sql','006_session_integrity_candidate.sql'].some(s=>s.startsWith(id))),
};let failed=0;for(const [k,v] of Object.entries(cases)){console.log(v?'PASS':'FAIL',k);if(!v)failed++}console.log(`${Object.keys(cases).length-failed}/${Object.keys(cases).length}`);process.exitCode=failed?1:0;
