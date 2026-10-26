import type {EnrollmentPreview,SessionPreview} from './view-model';
/** Fail closed on malformed internal API responses; preserve the existing My SPS layout. */
export function parseMySpsResponse(value:unknown):EnrollmentPreview[]|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const obj=value as Record<string,unknown>;
 if(!Array.isArray(obj.items)||obj.items.length>200)return null;
 const result:EnrollmentPreview[]=[];
 const validText=(x:unknown,n:number)=>typeof x==='string'&&x.length>0&&x.length<=n;
 for(const raw of obj.items){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const e=raw as Record<string,unknown>;
  if(!validText(e.id,128)||!validText(e.batch_title,250)||!['ACTIVE','COMPLETED','PENDING','WITHDRAWN'].includes(String(e.status)))return null;
  if(e.sessions!==undefined&&(!Array.isArray(e.sessions)||e.sessions.length>500))return null;
  const sessions:SessionPreview[]=[];
  for(const input of (e.sessions as unknown[]|undefined)??[]){
   if(!input||typeof input!=='object'||Array.isArray(input))return null;
   const s=input as Record<string,unknown>;
   if(!validText(s.id,128)||!validText(s.title,250)||!['PUBLISHED','DRAFT','CANCELLED'].includes(String(s.status))||!(s.starts_at===null||typeof s.starts_at==='string'&&s.starts_at.length<=64))return null;
   sessions.push({id:s.id as string,title:s.title as string,status:s.status as string,starts_at:s.starts_at as string|null});
  }
  result.push({id:e.id as string,batch_title:e.batch_title as string,status:e.status as string,sessions});
 }
 return result;
}
