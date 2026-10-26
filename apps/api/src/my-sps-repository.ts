/** SQL contract only: prepared parameters, never interpolate person identity from client input. */
export interface SqlRunner { query<T>(sql:string, params:readonly unknown[]):Promise<{rows:T[]}> }
export interface SessionPreview {id:string;title:string;starts_at:string;status:string}
export interface MySpsEnrollment {id:string;batch_id:string;batch_title:string;status:string;sessions:SessionPreview[]}
export async function loadOwnEnrollments(db:SqlRunner, authenticatedPersonId:string):Promise<MySpsEnrollment[]>{
 if(!/^[0-9a-fA-F-]{36}$/.test(authenticatedPersonId))throw new Error('Invalid server-side person ID');
 const result=await db.query<MySpsEnrollment>(`SELECT e.id, e.batch_id, b.title AS batch_title, e.status
   FROM enrollment e JOIN sps_batch b ON b.id=e.batch_id
   WHERE e.person_id=$1 ORDER BY e.created_at DESC, e.id DESC LIMIT 100`,[authenticatedPersonId]);
 // Only enrollment batch IDs obtained from authenticated self-scope may be queried.
 if (!result.rows.length) return [];
 const ids=[...new Set(result.rows.map(row=>row.batch_id))];
 const sessions=await db.query<SessionPreview & {batch_id:string}>(`SELECT id, batch_id, title, starts_at, publication_status AS status
   FROM learning_session WHERE batch_id = ANY($1::uuid[]) AND publication_status = 'PUBLISHED'
   AND starts_at >= now() - interval '1 day'
   ORDER BY starts_at ASC, id ASC LIMIT 250`,[ids]);
 const grouped=new Map<string,SessionPreview[]>();
 for(const session of sessions.rows){
  if(!ids.includes(session.batch_id)) continue; // strict defensive scope check against malformed DB adapter
  const list=grouped.get(session.batch_id)??[];
  list.push({id:session.id,title:session.title,starts_at:session.starts_at,status:session.status});
  grouped.set(session.batch_id,list);
 }
 return result.rows.map(row=>({...row,sessions:grouped.get(row.batch_id)??[]}));
}
