import type { SqlPool } from './zoom-evidence-inbox.ts';
import { verifyZoomWebhook } from './zoom-webhook-verification.ts';

export class WebhookReceiptRejected extends Error {readonly reason:string;constructor(reason:string){super(reason);this.reason=reason}}
/** A durable replay lock: unique event digest is inserted inside one PostgreSQL transaction. */
export async function recordVerifiedZoomWebhook(pool: SqlPool, input: {
  rawBody:Buffer; signature:unknown; timestamp:unknown; secret:unknown; nowSeconds:number;
}):Promise<{status:'ACCEPTED'|'DUPLICATE';eventId:string}> {
 const verification=verifyZoomWebhook({...input,previouslySeen:()=>false});
 if(!verification.ok)throw new WebhookReceiptRejected(verification.reason);
 const tx=await pool.connect();
 try {
  await tx.query('BEGIN');
  const inserted=await tx.query<{event_id:string}>(`INSERT INTO zoom_webhook_receipt(event_id,received_at,source_timestamp,body)
    VALUES($1,now(),to_timestamp($2),$3::jsonb) ON CONFLICT(event_id) DO NOTHING RETURNING event_id`,
    [verification.eventId,verification.timestampSeconds,JSON.stringify(verification.body)]);
  await tx.query('COMMIT');
  return {status:inserted.rows.length===1?'ACCEPTED':'DUPLICATE',eventId:verification.eventId};
 }catch(error){try{await tx.query('ROLLBACK')}catch{}throw error}finally{tx.release()}
}
