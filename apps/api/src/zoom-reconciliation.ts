import type { ZoomEvidence } from './zoom-evidence-contract.ts';
export type MatchStatus = 'READY_FOR_REVIEW'|'UNMATCHED'|'AMBIGUOUS'|'DUPLICATE'|'INVALID';
export type RosterCandidate={personId:string;meetingId:string;externalId:string;activeEnrollment:boolean};
export type Decision={status:MatchStatus;personId?:string;fingerprint:string;reason:string;attendanceMutated:false};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Human review is mandatory. Never persist canonical attendance here. */
export function reconcileZoomEvidence(evidence:ZoomEvidence,roster:readonly RosterCandidate[],knownFingerprints:ReadonlySet<string>):Decision {
 const fp=evidence?.fingerprint??'';
 const result=(status:MatchStatus,reason:string,personId?:string):Decision=>({status,reason,...(personId?{personId}:{}),fingerprint:fp,attendanceMutated:false});
 if(!evidence||evidence.provider!=='ZOOM'||evidence.status!=='PENDING_RECONCILIATION'||!/^[a-f0-9]{64}$/.test(fp)||!evidence.meetingId||!evidence.participantExternalId)return result('INVALID','Malformed evidence');
 if(knownFingerprints.has(fp))return result('DUPLICATE','Evidence fingerprint already recorded');
 const matches=roster.filter(r=>r.activeEnrollment&&r.meetingId===evidence.meetingId&&r.externalId===evidence.participantExternalId&&uuid.test(r.personId));
 if(!matches.length)return result('UNMATCHED','No enrolled participant matches meeting and external identifier');
 const unique=[...new Set(matches.map(m=>m.personId))];
 if(unique.length!==1)return result('AMBIGUOUS','Multiple eligible participants; manual resolution required');
 return result('READY_FOR_REVIEW','Candidate requires an authorized human decision',unique[0]);
}
