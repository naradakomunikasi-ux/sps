#!/usr/bin/env node
import {readdir,readFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=join(dirname(fileURLToPath(import.meta.url)),'..','migrations');
const names=(await readdir(root)).filter(x=>/^\d{3}_[a-z0-9_]+\.sql$/.test(x)).sort();
const plan=[];
for(let i=0;i<names.length;i++){
 if(Number(names[i].slice(0,3))!==i+1)throw Error('Migration order mismatch');
 const sql=await readFile(join(root,names[i]),'utf8');
 if(!/\bBEGIN\s*;/.test(sql)||!/\bCOMMIT\s*;\s*$/.test(sql))throw Error('Invalid transaction boundary '+names[i]);
 plan.push({name:names[i],sha256:createHash('sha256').update(sql).digest('hex'),sql});
}
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({executed:false,plan:plan.map(({sql,...x})=>x)},null,2));process.exit(0)}
if(!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL||''))throw Error('PostgreSQL DATABASE_URL required');
const {Pool}=await import('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000,max:1});
try{
 const db=await pool.connect();
 try{
  await db.query('SELECT pg_advisory_lock($1)',[20261030]);
  try{
   await db.query('CREATE TABLE IF NOT EXISTS sps_schema_migration(filename text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
   for(const m of plan){
    const old=await db.query('SELECT sha256 FROM sps_schema_migration WHERE filename=$1',[m.name]);
    if(old.rows.length){if(old.rows[0].sha256!==m.sha256)throw Error('Migration drift '+m.name);continue}
    await db.query('BEGIN');
    try{
     await db.query(m.sql.replace(/\bBEGIN\s*;/i,'').replace(/\bCOMMIT\s*;\s*$/i,''));
     await db.query('INSERT INTO sps_schema_migration(filename,sha256) VALUES ($1,$2)',[m.name,m.sha256]);
     await db.query('COMMIT');
    }catch(e){await db.query('ROLLBACK');throw e}
   }
  }finally{await db.query('SELECT pg_advisory_unlock($1)',[20261030])}
 }finally{db.release()}
}finally{await pool.end()}
