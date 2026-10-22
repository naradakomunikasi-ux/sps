import {createHash} from 'node:crypto';
export type ZoomEvidence=Readonly<{provider:'ZOOM';sourceEventId:string;meetingId:string;participantExternalId:string;displayName:string;joinedAt:string;leftAt:string;durationSeconds:number;receivedAt:string;fingerprint:string;status:'PENDING_RECONCILIATION'}>;
export type ZoomMeetingReference=Readonly<{provider:'ZOOM';meetingId:string;batchId:string;sessionId:string;joinUrl:string}>;
const pattern=/^[A-Za-z0-9_-]{1,128}$/;
function time(value:unknown):number|null{
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value))return null;
 const t=Date.parse(value);return Number.isFinite(t)?t:null;
}
export function parseZoomEvidence(payload:unknown,receivedAt:string):{ok:true;evidence:ZoomEvidence}|{ok:false;error:string}{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return {ok:false,error:'invalid payload'};
 const p=payload as Record<string,unknown>;
 for(const f of ['sourceEventId','meetingId','participantExternalId'])if(typeof p[f]!=='string'||!pattern.test(p[f] as string))return {ok:false,error:'invalid '+f};
 if(typeof p.displayName!=='string'||!p.displayName.trim()||p.displayName.length>250)return {ok:false,error:'invalid name'};
 const a=time(p.joinedAt),b=time(p.leftAt),r=time(receivedAt);
 if(a===null||b===null||r===null||b<a||b-a>86400000||b>r+300000)return {ok:false,error:'invalid interval'};
 const fingerprint=createHash('sha256').update([p.sourceEventId,p.meetingId,p.participantExternalId,p.joinedAt,p.leftAt].join('|')).digest('hex');
 return {ok:true,evidence:{provider:'ZOOM',sourceEventId:p.sourceEventId as string,meetingId:p.meetingId as string,participantExternalId:p.participantExternalId as string,displayName:p.displayName.trim(),joinedAt:p.joinedAt as string,leftAt:p.leftAt as string,durationSeconds:Math.floor((b-a)/1000),receivedAt,fingerprint,status:'PENDING_RECONCILIATION'}};
}
export function allowCanonicalAttendanceMutationFromZoom():false{return false}
export function parseMeetingReference(raw:unknown):ZoomMeetingReference|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const m=raw as Record<string,unknown>;
 if(typeof m.meetingId!=='string'||!pattern.test(m.meetingId)||typeof m.batchId!=='string'||!/^[0-9a-fA-F-]{36}$/.test(m.batchId)||typeof m.sessionId!=='string'||!/^[0-9a-fA-F-]{36}$/.test(m.sessionId)||typeof m.joinUrl!=='string')return null;
 try{const u=new URL(m.joinUrl);if(u.protocol!=='https:'||!['zoom.us','us02web.zoom.us','us04web.zoom.us'].includes(u.hostname)||u.username||u.password)return null}catch{return null}
 return {provider:'ZOOM',meetingId:m.meetingId,batchId:m.batchId,sessionId:m.sessionId,joinUrl:m.joinUrl};
}