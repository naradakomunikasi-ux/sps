import { authorize, type Context } from './security';
import {canTransition,requireIdempotencyKey} from './domain';
export type EnrollmentRequest={enrollmentId:string;personId:string;batchId:string;status:string;nextStatus:string;idempotencyKey:string};
// Decision only. Persistence and audit must commit atomically in a future database transaction.
export function validateEnrollmentChange(ctx:Context|null, req:EnrollmentRequest): {allowed:boolean;reason:string} {
 if(!ctx) return {allowed:false,reason:'AUTH_REQUIRED'};
 if(!authorize(ctx,'enrollment.manage.scoped',{batchId:req.batchId})) return {allowed:false,reason:'DENIED'};
 if(!canTransition(req.status,req.nextStatus)) return {allowed:false,reason:'INVALID_TRANSITION'};
 try { requireIdempotencyKey(req.idempotencyKey); } catch { return {allowed:false,reason:'INVALID_IDEMPOTENCY_KEY'}; }
 return {allowed:true,reason:'VALIDATION_ONLY'};
}
