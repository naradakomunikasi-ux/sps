import {createHash} from 'node:crypto';
export interface IdempotencyTx { query<T=unknown>(sql:string,values?:readonly unknown[]):Promise<{rows:T[]}> }
export interface IdempotencyPool { connect():Promise<IdempotencyTx & {release():void}> }
export class IdempotencyConflict extends Error {constructor(){super('Idempotency key reused with different request')}}
export type StoredOutcome={httpStatus:number;body:unknown};
export function hashIdempotentRequest(method:string,route:string,body:unknown):string{
 if(!['POST','PUT','PATCH','DELETE'].includes(method)||!route.startsWith('/')||route.includes('?'))throw new Error('Invalid mutation target');
 return createHash('sha256').update(JSON.stringify({method,route,body})).digest('hex');
}
export async function executeIdempotent(pool:IdempotencyPool,actorId:string,key:string,requestHash:string,action:(tx:IdempotencyTx)=>Promise<StoredOutcome>):Promise<{outcome:StoredOutcome;replayed:boolean}>{
 if(!/^[a-zA-Z0-9_-]{8,128}$/.test(key)||!/^[a-f0-9]{64}$/.test(requestHash)||!/^[0-9a-fA-F-]{36}$/.test(actorId))throw new Error('Invalid idempotency context');
 const tx=await pool.connect();
 try{
  await tx.query('BEGIN');
  await tx.query("INSERT INTO sps_idempotency(actor_id,idempotency_key,request_hash,status) VALUES ($1,$2,$3,'PROCESSING') ON CONFLICT (actor_id,idempotency_key) DO NOTHING",[actorId,key,requestHash]);
  const found=await tx.query<{request_hash:string;status:string;http_status:number|null;response_body:unknown}>('SELECT request_hash,status,http_status,response_body FROM sps_idempotency WHERE actor_id=$1 AND idempotency_key=$2 FOR UPDATE',[actorId,key]);
  if(found.rows.length!==1)throw new Error('Missing idempotency record');
  const prior=found.rows[0];if(prior.request_hash!==requestHash)throw new IdempotencyConflict();
  if(prior.status==='COMPLETED'){if(prior.http_status===null)throw new Error('Corrupt outcome');await tx.query('COMMIT');return {outcome:{httpStatus:prior.http_status,body:prior.response_body},replayed:true}}
  if(prior.status!=='PROCESSING')throw new Error('Unknown idempotency state');
  const outcome=await action(tx);
  if(!Number.isInteger(outcome.httpStatus)||outcome.httpStatus<200||outcome.httpStatus>599)throw new Error('Invalid outcome status');
  await tx.query("UPDATE sps_idempotency SET status='COMPLETED',http_status=$3,response_body=$4::jsonb,completed_at=now() WHERE actor_id=$1 AND idempotency_key=$2",[actorId,key,outcome.httpStatus,JSON.stringify(outcome.body)]);
  await tx.query('COMMIT');return {outcome,replayed:false};
 }catch(e){try{await tx.query('ROLLBACK')}catch{}throw e}finally{tx.release()}
}
