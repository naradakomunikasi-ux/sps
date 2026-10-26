import {existsSync} from 'node:fs';
const required=['package-lock.json','node_modules/.package-lock.json','node_modules/next/package.json','node_modules/@nestjs/core/package.json'];
const missing=required.filter(f=>!existsSync(new URL('../'+f,import.meta.url)));
if(missing.length){console.error('BLOCKED: dependencies not installed: '+missing.join(', '));process.exitCode=1}else console.log('PASS: lockfile and dependencies present (not build evidence)');
