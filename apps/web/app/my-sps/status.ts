export type PortalState = 'SIGN_IN_REQUIRED'|'LOADING'|'READY'|'FORBIDDEN'|'ERROR'|'EMPTY';
export function resolvePortalState(httpStatus:number|null,hasEnrollment:boolean):PortalState {
 if(httpStatus===null)return 'SIGN_IN_REQUIRED';
 if(httpStatus===401)return 'SIGN_IN_REQUIRED';
 if(httpStatus===403)return 'FORBIDDEN';
 if(httpStatus===200)return hasEnrollment?'READY':'EMPTY';
 return 'ERROR';
}
