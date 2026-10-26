import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Context, Role } from './security';
// HMAC tokens are a prototype transport only; production must use verified, revocable server-side sessions.
const allowedRoles = new Set<Role>(['PARTICIPANT','FACILITATOR','PTM_COORDINATOR','ADMIN','DIRECTOR']);
export function verifySignedContext(token: string|undefined, secret: string|undefined, now=Math.floor(Date.now()/1000)):Context|null {
 if (!token || !secret || secret.length < 32) return null;
 const pieces=token.split('.'); if(pieces.length!==2 || !/^[A-Za-z0-9_-]+$/.test(pieces[0]) || !/^[0-9a-f]{64}$/.test(pieces[1])) return null;
 const mac=createHmac('sha256',secret).update(pieces[0]).digest('hex');
 if(!timingSafeEqual(Buffer.from(mac),Buffer.from(pieces[1]))) return null;
 let data:unknown; try {data=JSON.parse(Buffer.from(pieces[0],'base64url').toString('utf8'));}catch{return null;}
 if(!data || typeof data!=='object')return null;
 const d=data as Record<string,unknown>;
 if(typeof d.personId!=='string'|| !/^[a-zA-Z0-9-]{6,80}$/.test(d.personId))return null;
 if(!allowedRoles.has(d.activeRole as Role)|| !Number.isInteger(d.exp)|| (d.exp as number)<=now || (d.exp as number)>now+3600)return null;
 if(!Array.isArray(d.batchIds)||d.batchIds.length>100||!d.batchIds.every(v=>typeof v==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(v)))return null;
 return {personId:d.personId,activeRole:d.activeRole as Role,batchIds:d.batchIds as string[]};
}
