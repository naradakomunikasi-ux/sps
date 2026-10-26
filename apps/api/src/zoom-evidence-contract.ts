import {createHash} from 'node:crypto';

/** An external meeting participant is NOT a canonical SPS participant identity. */
export type ZoomAttendanceEvidence = Readonly<{
  provider: 'ZOOM'; sourceEventId: string; meetingId: string;
  participantExternalId: string; displayName: string;
  joinedAt: string; leftAt: string; durationSeconds: number;
  receivedAt: string; fingerprint: string; status: 'PENDING_RECONCILIATION';
}>;
export type EvidenceParseResult = {ok: true; evidence: ZoomAttendanceEvidence} | {ok:false; error:string};

const idPattern=/^[A-Za-z0-9_-]{1,128}$/;
function instant(s:unknown):number|null {
 if(typeof s!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s))return null;
 const n=Date.parse(s);return Number.isFinite(n)?n:null;
}
/** Fail-closed boundary. Token/signature validation occurs in the ingress controller before parsing. */
export function parseZoomEvidence(payload:unknown, receivedAt:string):EvidenceParseResult {
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return {ok:false,error:'invalid payload'};
 const p=payload as Record<string,unknown>;
 for(const name of ['sourceEventId','meetingId','participantExternalId'])if(typeof p[name]!=='string'||!idPattern.test(p[name] as string))return {ok:false,error:`invalid ${name}`};
 if(typeof p.displayName!=='string'||!p.displayName.trim()||p.displayName.length>250)return {ok:false,error:'invalid displayName'};
 const start=instant(p.joinedAt),end=instant(p.leftAt),receipt=instant(receivedAt);
 if(start===null||end===null||receipt===null||end<start||end-start>86400000)return {ok:false,error:'invalid time interval'};
 if(end>receipt+300000)return {ok:false,error:'future evidence'};
 const seconds=Math.floor((end-start)/1000);
 const stable=[p.sourceEventId,p.meetingId,p.participantExternalId,p.joinedAt,p.leftAt].join('|');
 return {ok:true,evidence:{provider:'ZOOM',sourceEventId:p.sourceEventId as string,meetingId:p.meetingId as string,
 participantExternalId:p.participantExternalId as string,displayName:p.displayName.trim(),joinedAt:p.joinedAt as string,
 leftAt:p.leftAt as string,durationSeconds:seconds,receivedAt,fingerprint:createHash('sha256').update(stable).digest('hex'),status:'PENDING_RECONCILIATION'}};
}
export function allowCanonicalAttendanceMutationFromZoom():false {return false;}

/** Controlled meeting link contract; meeting creation/SDK invocation must use a separate server adapter. */
export type ZoomMeetingReference=Readonly<{provider:'ZOOM';meetingId:string;batchId:string;sessionId:string;joinUrl:string}>;
export function parseMeetingReference(raw:unknown):ZoomMeetingReference|null {
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const m=raw as Record<string,unknown>;
 if(typeof m.meetingId!=='string'||!idPattern.test(m.meetingId))return null;
 if(typeof m.batchId!=='string'||!/^[0-9a-fA-F-]{36}$/.test(m.batchId))return null;
 if(typeof m.sessionId!=='string'||!/^[0-9a-fA-F-]{36}$/.test(m.sessionId))return null;
 if(typeof m.joinUrl!=='string')return null;
 try{const url=new URL(m.joinUrl);if(url.protocol!=='https:'||!['zoom.us','us02web.zoom.us','us04web.zoom.us'].includes(url.hostname)||url.username||url.password)return null;}catch{return null}
 return {provider:'ZOOM',meetingId:m.meetingId,batchId:m.batchId,sessionId:m.sessionId,joinUrl:m.joinUrl};
}
