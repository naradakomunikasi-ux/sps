import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const page=readFileSync('apps/web/app/my-sps/page.tsx','utf8');
const bff=readFileSync('apps/web/app/api/my-sps/route.ts','utf8');
const main=readFileSync('apps/api/src/main.ts','utf8');
for(const [name,s] of [['My SPS server page',page],['BFF endpoint',bff]]) {
 assert.match(s,/\^\[A-Za-z0-9_-\]\{32,128\}\$/,'strict opaque token: '+name);
 assert.match(s,/url\.username\s*\|\|\s*url\.password/,'API credentials disallowed: '+name);
 assert.match(s,/url\.origin\s*!==\s*new URL\(base\)\.origin/,'same origin: '+name);
 assert.match(s,/cache:'no-store'/,'no-store: '+name);
 assert.match(s,/AbortSignal\.timeout\(4000\)/,'timeout: '+name);
 assert.doesNotMatch(s,/headers\(\).*get\(['"]host/,'untrusted host: '+name);
}
assert.match(main,/resolveSessionContext\(/);
assert.doesNotMatch(main,/verifySignedContext\(/);
console.log('CP019 14/14 source contract assertions PASS (not browser/HTTP E2E)');
