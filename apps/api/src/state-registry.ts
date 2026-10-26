/** Explicit SPS lifecycle contracts. No implicit transitions or arbitrary state names. */
export const stateRegistry = Object.freeze({
 enrollment: Object.freeze({
  APPLIED: Object.freeze(['REVIEW','WITHDRAWN']), REVIEW: Object.freeze(['APPROVED','WITHDRAWN']),
  APPROVED: Object.freeze(['ACTIVE','WITHDRAWN']), ACTIVE: Object.freeze(['COMPLETED','WITHDRAWN']),
  COMPLETED: Object.freeze([]), WITHDRAWN: Object.freeze([])
 }),
 batch: Object.freeze({
  DRAFT: Object.freeze(['REGISTRATION_OPEN']), REGISTRATION_OPEN: Object.freeze(['REGISTRATION_CLOSED']),
  REGISTRATION_CLOSED: Object.freeze(['ACTIVE']), ACTIVE: Object.freeze(['EVALUATION']),
  EVALUATION: Object.freeze(['COMPLETED']), COMPLETED: Object.freeze(['ARCHIVED']), ARCHIVED: Object.freeze([])
 })
});
export type StateModel=keyof typeof stateRegistry;
export function canTransitionState(model:StateModel,from:string,to:string):boolean {
 const transitions=stateRegistry[model] as Record<string,readonly string[]>;
 return typeof from==='string' && typeof to==='string' && Object.hasOwn(transitions,from) && transitions[from].includes(to);
}
