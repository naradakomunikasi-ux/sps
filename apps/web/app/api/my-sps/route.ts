import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
/** BFF proxy never forwards client-provided actor/role identifiers. Requires secure HttpOnly cookie issued by approved login flow. */
export async function GET(){
 const token=(await cookies()).get('sps_session')?.value;
 if(!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token))return NextResponse.json({error:'Sign-in required'},{status:401});
 const base=process.env.SPS_INTERNAL_API_URL;
 if(!base)return NextResponse.json({error:'Service unavailable'},{status:503});
 let url:URL;try{url=new URL('/v1/me/enrollments',base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.origin!==new URL(base).origin)throw Error('Invalid API URL');}catch{return NextResponse.json({error:'Service unavailable'},{status:503});}
 try{
  const response=await fetch(url,{
   headers:{Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(4000)
  });
  if(!response.ok)return NextResponse.json({error:response.status===401?'Sign-in required':response.status===403?'Forbidden':'Service unavailable'},{status:[401,403].includes(response.status)?response.status:503});
  return NextResponse.json(await response.json(),{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Service unavailable'},{status:503});}
}
