import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../db/migrations/',import.meta.url);
const names=readdirSync(root).filter(f=>f.endsWith('.sql')).sort();
const issues=[];
for(let i=0;i<names.length;i++){
 const expected=String(i+1).padStart(3,'0')+'_';
 if(!names[i].startsWith(expected))issues.push(`sequence mismatch: ${names[i]}`);
 const sql=readFileSync(new URL(names[i],root),'utf8');
 if(!sql.trim())issues.push(`empty: ${names[i]}`);
 if(/\bDROP\s+(DATABASE|SCHEMA)\b/i.test(sql))issues.push(`destructive schema drop: ${names[i]}`);
 if(/\b(TRUNCATE|DELETE\s+FROM)\b/i.test(sql))issues.push(`data deletion requires review: ${names[i]}`);
}
console.log(JSON.stringify({kind:'offline_sql_preflight_only',count:names.length,files:names,issues,postgresExecution:'NOT_RUN'},null,2));
if(issues.length)process.exitCode=1;
