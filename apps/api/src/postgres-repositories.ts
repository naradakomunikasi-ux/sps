import type { SessionRepository, SessionRecord, AssignedRole } from './session-repository';
import type { SqlRunner } from './my-sps-repository';
/** PostgreSQL adapter. Caller supplies a real pool; no in-memory identities. */
export class PgSessionRepository implements SessionRepository {
 constructor(private readonly db: SqlRunner) {}
 async findActiveSessionByHash(hash:string,now:Date):Promise<SessionRecord|null>{
  const found=await this.db.query<{id:string;user_account_id:string;person_id:string;expires_at:Date;revoked_at:Date|null;active_role_code:string|null}>(
   `SELECT s.id,s.user_account_id,a.person_id,s.expires_at,s.revoked_at,s.active_role_code FROM auth_session s
    JOIN user_account a ON a.id=s.user_account_id
    WHERE s.token_hash=$1 AND s.expires_at>$2 AND s.revoked_at IS NULL AND a.enabled=TRUE LIMIT 1`,[hash,now]);
  const s=found.rows[0];return s?{id:s.id,userAccountId:s.user_account_id,personId:s.person_id,expiresAt:new Date(s.expires_at),revokedAt:s.revoked_at?new Date(s.revoked_at):null,activeRoleCode:s.active_role_code}:null;
 }
 async listEffectiveRoles(accountId:string):Promise<AssignedRole[]>{
  const found=await this.db.query<{role_code:string;batch_id:string|null}>(
  `SELECT role_code,batch_id FROM role_assignment WHERE user_account_id=$1 AND enabled=TRUE ORDER BY role_code,batch_id NULLS FIRST`,[accountId]);
  return found.rows.map(row=>({code:row.role_code,batchIds:row.batch_id?[row.batch_id]:[],enabled:true}));
 }
}
