#!/usr/bin/env node
// Minimal SYNTHETIC fixture for isolated local development only, never production.
const args=new Set(process.argv.slice(2));
const inserts=[
 ['INSERT INTO person(id,full_name,email) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', ['11111111-1111-4111-8111-111111111111','SPS Synthetic Student','synthetic.student@example.invalid']],
 ['INSERT INTO sps_batch(id,code,title) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', ['33333333-3333-4333-8333-333333333333','SPS-DEMO-001','Synthetic SPS Demo Batch']],
 ['INSERT INTO enrollment(id,person_id,batch_id,status) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING', ['55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','ACTIVE']]
];
if(args.has('--dry-run')){console.log(JSON.stringify({status:'DRY_RUN_ONLY',queries:inserts,executed:false},null,2));process.exit(0)}
if(process.env.NODE_ENV==='production')throw new Error('Development seed prohibited in production');
if(process.env.SPS_ALLOW_DEV_SEED!=='yes')throw new Error('Set SPS_ALLOW_DEV_SEED=yes explicitly');
if(!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL||''))throw new Error('PostgreSQL DATABASE_URL required');
const {Pool}=await import('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL,max:1});
try{const client=await pool.connect();try{await client.query('BEGIN');try{for(const [sql,params] of inserts)await client.query(sql,params);await client.query('COMMIT');console.log('Development seed applied');}catch(e){await client.query('ROLLBACK');throw e}}finally{client.release()}}finally{await pool.end()}
