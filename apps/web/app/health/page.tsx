export default async function SystemStatus(){
 const base=process.env.SPS_API_INTERNAL_URL;
 let status='NOT_CONFIGURED';
 if(base){try{const u=new URL('/health',base);if(!['http:','https:'].includes(u.protocol))throw new Error('Invalid protocol');const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(3000)});status=r.ok?'REACHABLE':'UNHEALTHY';}catch{status='UNREACHABLE';}}
 return <main style={{fontFamily:'system-ui',padding:'2rem'}}><h1>SPS service status</h1><p role="status">API: {status}</p><p>No participant records are displayed on this public diagnostic page.</p></main>;
}
