import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const tasks = [
  ['structure', ['run','check:structure']],
  ['security-contract', ['run','test:contracts']],
  ['regression', ['run','test:regression']],
  ['install-readiness', ['run','check:install']],
];
const results = tasks.map(([name,args]) => {
  const p=spawnSync('npm',args,{encoding:'utf8',timeout:60000,env:{...process.env,CI:'true'}});
  const status=p.status===null?'NOT_RUN':p.status===0?'PASS':'FAIL';
  return {name,status,exitCode:p.status,error:p.error?.message??null,stdout:(p.stdout??'').slice(-1500),stderr:(p.stderr??'').slice(-1500)};
});
writeFileSync('engineering-evidence.json',JSON.stringify({schema:'SPS-CE-LOCAL-TEST-1',generatedAt:new Date().toISOString(),results},null,2)+'\n');
console.log(results.map(r=>`${r.name}: ${r.status} (exit ${r.exitCode})`).join('\n'));
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
