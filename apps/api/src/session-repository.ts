/** Persistence contract only: implementation must verify DB-backed sessions and role assignments. */
export interface SessionRecord {id:string; userAccountId:string; personId:string; expiresAt:Date; revokedAt:Date|null; activeRoleCode:string|null;}
export interface AssignedRole {code:string; batchIds:string[]; enabled:boolean;}
export interface SessionRepository {
 findActiveSessionByHash(tokenHash:string, now:Date):Promise<SessionRecord|null>;
 listEffectiveRoles(userAccountId:string):Promise<AssignedRole[]>;
}
export function sessionIsActive(s:SessionRecord|null,now:Date):boolean {
 return !!s && s.revokedAt === null && s.expiresAt.getTime()>now.getTime();
}
