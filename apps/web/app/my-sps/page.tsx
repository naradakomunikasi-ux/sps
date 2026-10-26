import { parseMySpsResponse } from './api-contract';
import { EnrollmentDashboard } from './dashboard';
import { cookies } from 'next/headers';
export const dynamic='force-dynamic';
export default async function MySps(){
 const cookie=(await cookies()).get('sps_session')?.value;
 let state:'LOGIN'|'FORBIDDEN'|'UNAVAILABLE'|'READY'|'EMPTY'='LOGIN';
 let items:Array<{id:string;batch_title:string;status:string;sessions?:Array<{id:string;title:string;starts_at:string|null;status:string}>}>=[];
 if(cookie && /^[A-Za-z0-9_-]{32,128}$/.test(cookie)){
  state='UNAVAILABLE';
  try {
   // Trusted internal API URL, not attacker-controlled Host header / SSRF.
   const base=process.env.SPS_INTERNAL_API_URL;
   if(base){
    const url=new URL('/v1/me/enrollments',base);
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password || url.origin !== new URL(base).origin) throw new Error('Invalid internal API configuration');
    const response=await fetch(url,{headers:{Authorization:`Bearer ${cookie}`},cache:'no-store',signal:AbortSignal.timeout(4000)});
    if(response.status===401)state='LOGIN';
    else if(response.status===403)state='FORBIDDEN';
    else if(response.ok){const body=await response.json();const parsed=parseMySpsResponse(body);if(parsed===null){state='UNAVAILABLE';}else{items=parsed;state=items.length?'READY':'EMPTY';}}
   }
  }catch{state='UNAVAILABLE';}
 }
 return <main style={{maxWidth:820,margin:'auto',padding:'2rem',fontFamily:'system-ui'}}><h1>My SPS</h1>
 {state==='LOGIN'&&<section><h2>Sign-in required</h2><p>Sign in with a verified SPS account.</p></section>}
 {state==='UNAVAILABLE'&&<div role="alert"><p>My SPS is temporarily unavailable. Try again later.</p><a href="/my-sps">Retry</a></div>}
 {state==='FORBIDDEN'&&<p role="alert">You do not have permission to view this SPS workspace.</p>}
 {state==='EMPTY'&&<p role="status">No SPS enrollment was found for this account.</p>}
 {state==='READY'&&<EnrollmentDashboard items={items}/>}
 <a href="/">Return to public website</a></main>;
}
