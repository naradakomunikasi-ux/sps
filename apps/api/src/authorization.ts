import { authorize, type Context, type Resource } from './security.ts';
/** No resource access without validated session and exact resource scope. */
export function enforceScope(ctx:Context|null, permission:string, resource:Resource):boolean {
 return authorize(ctx,permission,resource);
}
export function canReadOwnEnrollment(ctx:Context|null,personId:string):boolean {
 return enforceScope(ctx,'enrollment.read.self',{personId});
}
export function canReadAssignedSession(ctx:Context|null,batchId:string):boolean {
 return enforceScope(ctx,'session.read.assigned',{batchId});
}
export function canManageBatchEnrollment(ctx:Context|null,batchId:string):boolean {
 return enforceScope(ctx,'enrollment.manage.scoped',{batchId});
}
export function canReadScopedParticipant(ctx:Context|null,batchId:string):boolean {
 return enforceScope(ctx,'participant.read.scoped',{batchId});
}
export function canReadPtm(ctx:Context|null,batchId:string):boolean {
 return enforceScope(ctx,'ptm.read.scoped',{batchId}) || enforceScope(ctx,'ptm.read.assigned',{batchId});
}
export function canReadBatchReport(ctx:Context|null,batchId:string):boolean {
 return enforceScope(ctx,'report.read.scoped',{batchId});
}
