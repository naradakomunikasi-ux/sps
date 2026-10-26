import { createHmac, timingSafeEqual } from 'node:crypto';

/** Handle Zoom's endpoint.url_validation separately from attendance/event ingestion.
 * A challenge response is returned only for a valid provider HMAC with a fresh timestamp.
 */
export function verifyZoomUrlValidation(input: {
  rawBody: unknown; signature: unknown; timestamp: unknown; secret: unknown; nowSeconds: number;
}): {plainToken: string; encryptedToken: string} | null {
  const {rawBody,signature,timestamp,secret,nowSeconds}=input;
  if (!Buffer.isBuffer(rawBody) || rawBody.length===0 || rawBody.length>4096) return null;
  if(typeof secret!=='string'||secret.length<16||typeof timestamp!=='string'||!/^[0-9]{10}$/.test(timestamp)) return null;
  if(typeof signature!=='string'||!/^v0=[0-9a-f]{64}$/.test(signature))return null;
  const timestampSeconds=Number(timestamp);
  if(!Number.isSafeInteger(timestampSeconds)||!Number.isFinite(nowSeconds)||Math.abs(timestampSeconds-nowSeconds)>300)return null;
  const expected='v0='+createHmac('sha256',secret).update(Buffer.concat([Buffer.from(`v0:${timestamp}:`),rawBody])).digest('hex');
  if(!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;
  let body:unknown;
  try{body=JSON.parse(rawBody.toString('utf8'))}catch{return null}
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const payload=body as Record<string,unknown>;
  if(payload.event!=='endpoint.url_validation'||!payload.payload||typeof payload.payload!=='object'||Array.isArray(payload.payload))return null;
  const token=(payload.payload as Record<string,unknown>).plainToken;
  if(typeof token!=='string'||token.length<1||token.length>512)return null;
  return {plainToken:token,encryptedToken:createHmac('sha256',secret).update(token).digest('hex')};
}
