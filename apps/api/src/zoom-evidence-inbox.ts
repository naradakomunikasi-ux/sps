import type {ZoomEvidence} from './zoom-evidence-contract.ts';
import type {Decision} from './zoom-reconciliation.ts';
export interface SqlTransaction {query<T=unknown>(sql:string,values?:readonly unknown[]):Promise<{rows:T[]}>}
export interface SqlPool {connect():Promise<SqlTransaction&{release():void}>}
export class ReviewConflict extends Error {constructor(message:string){super(message);this.name='ReviewConflict'}}
const uuid=/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
export async function storeZoomEvidence(db:SqlTransaction,id:string,evidence:ZoomEvidence):Promise<'INSERTED'|'DUPLICATE'>{
 if(!uuid.test(id)||evidence?.status!=='PENDING_RECONCILIATION'||evidence.provider!=='ZOOM'||!/^[a-f0-9]{64}$/.test(evidence.fingerprint))throw new ReviewConflict('Invalid evidence');
 const result=await db.query<{id:string}>(`INSERT INTO zoom_evidence_inbox(id,source_event_id,meeting_id,participant_external_id,fingerprint,payload,received_at)
 VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) ON CONFLICT DO NOTHING RETURNING id`,[id,evidence.sourceEventId,evidence.meetingId,evidence.participantExternalId,evidence.fingerprint,JSON.stringify(evidence),evidence.receivedAt]);
 return result.rows.length?'INSERTED':'DUPLICATE';
}
/** Atomic review decision. Canonical attendance updates are deliberately not performed here. */
export async function submitZoomReview(pool:SqlPool,input:{evidenceId:string;reviewerId:string;decision:'APPROVED'|'REJECTED';reason:string;candidate:Decision;correlationId:string}):Promise<{decision:'APPROVED'|'REJECTED';attendanceMutated:false}>{
 const {evidenceId,reviewerId,decision,reason,candidate,correlationId}=input;
 if(!uuid.test(evidenceId)||!uuid.test(reviewerId)||!reason?.trim()||reason.length>1000||!/^[A-Za-z0-9_-]{8,128}$/.test(correlationId)||!['APPROVED','REJECTED'].includes(decision)||candidate?.attendanceMutated!==false||(decision==='APPROVED'&&(candidate.status!=='READY_FOR_REVIEW'||!candidate.personId||!uuid.test(candidate.personId))))throw new ReviewConflict('Invalid review context');
 const tx=await pool.connect();
 try{
  await tx.query('BEGIN');
  // Reviewer authorization is resolved from the database, not supplied by the caller.
  const reviewer=await tx.query<{id:string}>(`SELECT p.id FROM person p JOIN user_account ua ON ua.person_id=p.id
   JOIN role_assignment ra ON ra.user_account_id=ua.id
   WHERE p.id=$1 AND ua.enabled=TRUE AND ra.enabled=TRUE AND ra.role_code='ADMIN' LIMIT 1`,[reviewerId]);
  if(reviewer.rows.length!==1)throw new ReviewConflict('Reviewer lacks active admin assignment');
  const rows=await tx.query<{id:string;state:string;fingerprint:string;candidate_person_id:string|null}>('SELECT id,state,fingerprint,candidate_person_id FROM zoom_evidence_inbox WHERE id=$1 FOR UPDATE',[evidenceId]);
  const item=rows.rows[0];
  if(rows.rows.length!==1||!item||item.state==='APPROVED'||item.state==='REJECTED'||item.fingerprint!==candidate.fingerprint||(decision==='APPROVED'&&item.candidate_person_id!==candidate.personId)||(item.candidate_person_id&&item.candidate_person_id!==candidate.personId))throw new ReviewConflict('Evidence stale or already resolved');
  await tx.query(`UPDATE zoom_evidence_inbox SET state=$2, reviewed_at=now(),reviewed_by=$3,review_note=$4,candidate_person_id=$5 WHERE id=$1`,[evidenceId,decision,reviewerId,reason.trim(),candidate.personId??null]);
  await tx.query(`INSERT INTO audit_event(actor_person_id,action,entity_type,entity_id,correlation_id,payload) VALUES ($1,'ZOOM_EVIDENCE_REVIEW','zoom_evidence_inbox',$2,$3,$4::jsonb)`,[reviewerId,evidenceId,correlationId,JSON.stringify({decision,reason:reason.trim(),candidatePersonId:candidate.personId??null})]);
  await tx.query('COMMIT');return {decision,attendanceMutated:false};
 }catch(e){try{await tx.query('ROLLBACK')}catch{}throw e}finally{tx.release()}
}
