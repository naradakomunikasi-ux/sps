import { createHmac, timingSafeEqual } from 'node:crypto';

export type ZoomWebhookVerification =
  | { ok: true; eventId: string; timestampSeconds: number; body: unknown }
  | { ok: false; reason: 'CONFIG_MISSING'|'INVALID_HEADER'|'STALE_TIMESTAMP'|'INVALID_SIGNATURE'|'INVALID_BODY'|'REPLAY' };

/**
 * Pure verification boundary. A caller MUST use the original UTF-8 request bytes
 * before JSON parsing and persist eventId atomically with inbox acceptance.
 * This module neither accepts attendance nor updates any canonical record.
 */
export function verifyZoomWebhook(input: {
  rawBody: Buffer; signature: unknown; timestamp: unknown; secret: unknown;
  nowSeconds: number; previouslySeen: (eventId: string) => boolean;
}): ZoomWebhookVerification {
  const { rawBody, signature, timestamp, secret, nowSeconds, previouslySeen } = input;
  if (typeof secret !== 'string' || secret.length < 16) return {ok:false,reason:'CONFIG_MISSING'};
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0 || rawBody.length > 1024 * 1024) return {ok:false,reason:'INVALID_BODY'};
  if (typeof timestamp !== 'string' || !/^\d{10}$/.test(timestamp)
    || typeof signature !== 'string' || !/^v0=[0-9a-f]{64}$/.test(signature)) return {ok:false,reason:'INVALID_HEADER'};
  const ts = Number(timestamp);
  if (!Number.isSafeInteger(ts) || !Number.isFinite(nowSeconds) || Math.abs(nowSeconds - ts) > 300) return {ok:false,reason:'STALE_TIMESTAMP'};
  const expected = 'v0=' + createHmac('sha256',secret).update(Buffer.concat([Buffer.from(`v0:${timestamp}:`),rawBody])).digest('hex');
  if (!timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) return {ok:false,reason:'INVALID_SIGNATURE'};
  let payload: unknown;
  try {payload=JSON.parse(rawBody.toString('utf8'));} catch {return {ok:false,reason:'INVALID_BODY'};}
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {ok:false,reason:'INVALID_BODY'};
  const event=(payload as Record<string,unknown>).event;
  const data=(payload as Record<string,unknown>).event_ts;
  if (typeof event !== 'string' || !/^[a-z_.]{3,80}$/.test(event) || typeof data !== 'number' || !Number.isSafeInteger(data) || data <= 0) return {ok:false,reason:'INVALID_BODY'};
  // Hash the original payload, not a user-supplied ID; collision-resistant event identity.
  const eventId=createHmac('sha256',secret).update(rawBody).digest('hex');
  if (previouslySeen(eventId)) return {ok:false,reason:'REPLAY'};
  return {ok:true,eventId,timestampSeconds:ts,body:payload};
}
