const portals = [
 {title:"My SPS", detail:"Profile, enrollment and learning journey", href:"/my-sps"},
 {title:"Learning", detail:"Sessions and learning materials", href:"/my-sps"},
 {title:"Staff workspace", detail:"Role-scoped access; authentication required", href:"/my-sps"}
];
export default function Page() {
 return <main style={{maxWidth:960,margin:"auto",padding:"2rem",fontFamily:"system-ui"}}>
  <h1>SPS Platform</h1><p>Sekolah Penginjilan Supernatural</p>
  <p>Engineering development preview. Access is denied until authentication is configured.</p>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
  {portals.map(p=><article key={p.title} style={{border:"1px solid #ddd",padding:20,borderRadius:12}}><h2>{p.title}</h2><p>{p.detail}</p><a href={p.href}>Open workspace</a></article>)}
  </section></main>;
}
