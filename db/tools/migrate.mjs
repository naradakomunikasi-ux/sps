#!/usr/bin/env node
// Explicit deployment-time migration runner. Never auto-run on application startup.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const base = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const files = (await readdir(base)).filter(f=>/^\d{3}_[a-z0-9_]+\.sql$/.test(f)).sort();
const mode=process.argv.includes('--dry-run')?'dry-run':'apply';
const plan=[];
for(let i=0;i<files.length;i++){
 if(Number(files[i].slice(0,3))!==i+1)throw new Error(`Non-contiguous migration: ${files[i]}`);
 const body=await readFile(join(base,files[i]),'utf8');
 if(!body.trim().startsWith('--') || !/\bBEGIN\s*;/.test(body)||!/\bCOMMIT\s*;/.test(body))throw new Error(`Unreviewed SQL transaction boundary: ${files[i]}`);
 plan.push({file:files[i],sha256:createHash('sha256').update(body).digest('hex'),body});
}
if(mode==='dry-run'){
 console.log(JSON.stringify({status:'DRY_RUN_ONLY',migrations:plan.map(({body,...p})=>p),executed:false},null,2));
 process.exit(0);
}
if(!process.env.DATABASE_URL || !/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL))throw new Error('DATABASE_URL PostgreSQL connection required');
const {Pool}=await import('pg');
const pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,max:1});
try{
 const client=await pool.connect();
 try{
  await client.query('SELECT pg_advisory_lock($1)',[20261030]);
  try{
   await client.query(`CREATE TABLE IF NOT EXISTS sps_schema_migration (filename text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
   for(const item of plan){
    const existing=await client.query('SELECT sha256 FROM sps_schema_migration WHERE filename=$1',[item.file]);
    if(existing.rows.length){if(existing.rows[0].sha256!==item.sha256)throw new Error(`Migration drift: ${item.file}`);continue;}
    // Schema and receipt are one transaction; rollback together on failure.
    const sql=item.body.replace(/\bBEGIN\s*;/i,'').replace(/\bCOMMIT\s*;\s*$/i,'');
    await client.query('BEGIN');
    try {
     await client.query(sql);
     await client.query('INSERT INTO sps_schema_migration(filename,sha256) VALUES ($1,$2)',[item.file,item.sha256]);
     await client.query('COMMIT');
    } catch(err) { await client.query('ROLLBACK'); throw err; }
    console.log(`APPLIED ${item.file}`);
   }
  }finally{await client.query('SELECT pg_advisory_unlock($1)',[20261030]);}
 }finally{client.release();}
}finally{await pool.end();}
