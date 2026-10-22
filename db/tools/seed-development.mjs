#!/usr/bin/env node
// Synthetic-only, explicit opt-in seed; never for production.
const statements=[
 ['INSERT INTO person(id,full_name,email) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING',['11111111-1111-4111-8111-111111111111','SPS Synthetic Student','synthetic.student@example.invalid']],
 ['INSERT INTO sps_batch(id,code,title) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING',['33333333-3333-4333-8333-333333333333','SPS-DEMO-001','Synthetic SPS Demo Batch']],
 ['INSERT INTO enrollment(id,person_id,batch_id,status) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING',['55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','ACTIVE']]
];
if(process.argv.includes('--dry-run')){console.log(JSON.stringify({executed:false,queries:statements},null,2));process.exit(0)}
if(process.env.NODE_ENV==='production'||process.env.SPS_ALLOW_DEV_SEED!=='yes')throw Error('Development seed requires explicit permission and nonproduction environment');
if(!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL||''))throw Error('PostgreSQL DATABASE_URL required');
const {Pool}=await import('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
try{const db=await pool.connect();try{await db.query('BEGIN');try{for(const [sql,params] of statements)await db.query(sql,params);await db.query('COMMIT')}catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}}finally{await pool.end()}
