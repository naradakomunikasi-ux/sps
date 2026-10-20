import { canTransitionState, type StateModel } from './state-registry.ts';
export type TransitionAttempt = Readonly<{model:StateModel;from:string;to:string;actorPersonId:string;reason:string;correlationId:string}>;
export type TransitionDecision = Readonly<{allowed:true;model:StateModel;from:string;to:string;actorPersonId:string;reason:string;correlationId:string}|{allowed:false;code:'INVALID_CONTEXT'|'INVALID_TRANSITION';reason:string}>;
/** Pure domain guard. Transactional compare-and-set and audit are required at persistence boundary. */
export function evaluateTransition(attempt:TransitionAttempt):TransitionDecision {
 if(!attempt || !['batch','enrollment'].includes(attempt.model) ||
 typeof attempt.actorPersonId!=='string' || !/^[0-9a-fA-F-]{36}$/.test(attempt.actorPersonId) ||
 typeof attempt.reason!=='string' || !attempt.reason.trim() || attempt.reason.length>500 ||
 typeof attempt.correlationId!=='string' || !/^[A-Za-z0-9_-]{8,128}$/.test(attempt.correlationId))
 return {allowed:false,code:'INVALID_CONTEXT',reason:'Auditable transition context required'};
 if(!canTransitionState(attempt.model,attempt.from,attempt.to))
 return {allowed:false,code:'INVALID_TRANSITION',reason:'State change is not allowed'};
 return {allowed:true,...attempt,reason:attempt.reason.trim()};
}