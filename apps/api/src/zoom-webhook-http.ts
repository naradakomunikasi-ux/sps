import { verifyZoomUrlValidation } from './zoom-url-validation.ts';
import { recordVerifiedZoomWebhook, WebhookReceiptRejected } from './zoom-webhook-receipt.ts';
import type { SqlPool } from './zoom-evidence-inbox.ts';

export type ReceiptHttpResult = Readonly<{ status: number; body: { outcome: 'accepted'|'duplicate'|'rejected'|'unavailable' } | {plainToken:string;encryptedToken:string} }>;
/** HTTP adapter contract, NOT a mounted route. Transport must preserve the raw body bytes.
 * Do not expose verification details or database errors to webhook callers. */
export async function receiveZoomWebhook(input: {
  pool?: SqlPool; rawBody: unknown; signature: unknown; timestamp: unknown;
  secret: unknown; nowSeconds: number;
}): Promise<ReceiptHttpResult> {
  if (!Buffer.isBuffer(input.rawBody)) return {status:400,body:{outcome:'rejected'}};
  // Provider URL challenge must not create an attendance/event receipt.
  const challenge=verifyZoomUrlValidation(input);
  if(challenge) return {status:200,body:challenge};
  if (!input.pool) return {status:503,body:{outcome:'unavailable'}};
  try {
    const receipt=await recordVerifiedZoomWebhook(input.pool, {
      rawBody: input.rawBody as Buffer,
      signature:input.signature, timestamp:input.timestamp,
      secret:input.secret,nowSeconds:input.nowSeconds
    });
    return {status:200,body:{outcome:receipt.status==='ACCEPTED'?'accepted':'duplicate'}};
  } catch(error) {
    if(error instanceof WebhookReceiptRejected) return {status:401,body:{outcome:'rejected'}};
    return {status:503,body:{outcome:'unavailable'}};
  }
}
