import { resolveSessionContext } from './session-service';
import { canReadOwnEnrollment } from './authorization';
import { loadOwnEnrollments, type SqlRunner } from './my-sps-repository';
import type { SessionRepository } from './session-repository';
export type OwnEnrollmentResult = {status:401|403|200;body:unknown};
export async function getOwnEnrollments(rawToken:string|undefined,sessions:SessionRepository,db:SqlRunner):Promise<OwnEnrollmentResult>{
 const ctx=await resolveSessionContext(rawToken,sessions);
 if(!ctx)return {status:401,body:{error:'Sign-in required'}};
 if(!canReadOwnEnrollment(ctx,ctx.personId))return {status:403,body:{error:'Forbidden'}};
 return {status:200,body:{items:await loadOwnEnrollments(db,ctx.personId)}};
}
