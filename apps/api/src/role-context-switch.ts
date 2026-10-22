import {createHash} from 'node:crypto';
import type {Role} from './security';
export interface RoleSwitchDb {connect():Promise<{query<T=unknown>(sql:string,params?:readonly unknown[]):Promise<{rows:T[]}>;release():void}>}
const roles:ReadonlySet<string>=new Set(['PARTICIPANT','FACILITATOR','PTM_COORDINATOR','ADMIN','DIRECTOR']);
export class RoleSwitchDenied extends Error {constructor(){super('Role context change denied');this.name='RoleSwitchDenied'}}
/** Server-side transaction validates a live bearer session and an enabled role assignment. */
export async function changeOwnActiveRole(pool:RoleSwitchDb,token:string,requestedRole:Role,correlationId:string,now:Date=new Date()):Promise<{activeRole:Role}> {
 if(!/^[A-Za-z0-9_-]{32,128}$/.test(token)||!roles.has(requestedRole)||!/^[A-Za-z0-9_-]{8,128}$/.test(correlationId)||!Number.isFinite(now.getTime()))throw new RoleSwitchDenied();
 const hash=createHash('sha256').update(token).digest('hex');
 const client=await pool.connect();
 try {
  await client.query('BEGIN');
  const active=await client.query<{id:string;user_account_id:string;person_id:string;active_role_code:string|null}>(`SELECT s.id,s.user_account_id,a.person_id,s.active_role_code FROM auth_session s
   JOIN user_account a ON a.id=s.user_account_id
   WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>$2 AND a.enabled=TRUE
   FOR UPDATE OF s`,[hash,now]);
  const session=active.rows[0];if(active.rows.length!==1||!session)throw new RoleSwitchDenied();
  const grant=await client.query<{role_code:string}>(`SELECT DISTINCT role_code FROM role_assignment
   WHERE user_account_id=$1 AND role_code=$2 AND enabled=TRUE LIMIT 1`,[session.user_account_id,requestedRole]);
  if(grant.rows.length!==1)throw new RoleSwitchDenied();
  if(session.active_role_code!==requestedRole){
   await client.query('UPDATE auth_session SET active_role_code=$2 WHERE id=$1',[session.id,requestedRole]);
   await client.query(`INSERT INTO audit_event(actor_person_id,action,entity_type,entity_id,correlation_id,payload)
     VALUES ($1,'SESSION_ROLE_SWITCH','auth_session',$2,$3,$4::jsonb)`,[session.person_id,session.id,correlationId,JSON.stringify({from:session.active_role_code,to:requestedRole})]);
  }
  await client.query('COMMIT');return {activeRole:requestedRole};
 }catch(e){try{await client.query('ROLLBACK')}catch{};if(e instanceof RoleSwitchDenied)throw e;throw new Error('Role context unavailable');}
 finally{client.release()}
}