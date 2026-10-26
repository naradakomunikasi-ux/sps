import { createHash } from 'node:crypto';
import type { Context, Role } from './security';
import type { SessionRepository } from './session-repository';
const validRoles = new Set<Role>(['PARTICIPANT','FACILITATOR','PTM_COORDINATOR','ADMIN','DIRECTOR']);
/** An opaque session token is resolved server-side; no client-supplied role or personId is trusted. */
export async function resolveSessionContext(rawToken: string | undefined, repo: SessionRepository, now = new Date()):Promise<Context|null>{
 if (!rawToken || !/^[A-Za-z0-9_-]{32,128}$/.test(rawToken)) return null;
 const tokenHash=createHash('sha256').update(rawToken).digest('hex');
 const session=await repo.findActiveSessionByHash(tokenHash,now);
 if(!session || session.revokedAt!==null || session.expiresAt.getTime()<=now.getTime())return null;
 const roles=await repo.listEffectiveRoles(session.userAccountId);
 // Fail closed when no enabled, recognized assignment exists. Default to least privileged role.
 const enabled=roles.filter(role=>role.enabled && validRoles.has(role.code as Role));
 // Role resolution must be unambiguous: no implicit elevation from alphabetic ordering.
 // Until explicit active-role selection is implemented, only a single effective role is accepted.
 const chosen=session.activeRoleCode;
 // Session role is selected only by trusted server-side transaction, never from request headers/query params.
 if (!chosen) return null;
 const matches=enabled.filter(role=>role.code===chosen);
 if (matches.length===0) return null;
 const selected={code:chosen,batchIds:matches.flatMap(role=>role.batchIds)};
 return {personId:session.personId,activeRole:selected.code as Role,batchIds:[...new Set(selected.batchIds.filter(id=>/^[a-zA-Z0-9-]{1,80}$/.test(id)))]};
}
