import { summarizeMySps } from './view-model';
type SessionPreview={id:string;title:string;starts_at:string|null;status:string};
type Enrollment={id:string;batch_title:string;status:string;sessions?:SessionPreview[]};
const labels:Record<string,string>={ACTIVE:'Sedang berjalan',COMPLETED:'Selesai',PENDING:'Menunggu',WITHDRAWN:'Berhenti'};
const displayDate=(iso:string)=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'}).format(new Date(iso));
/** Read-only participant overview; no new user workflow or manual verification checklist. */
export function EnrollmentDashboard({items}:{items:Enrollment[]}) {
 const {active,history,nextSession,upcoming}=summarizeMySps(items);
 return <section aria-label="Ringkasan My SPS" className="mySps">
  <section aria-labelledby="activeHeading"><h2 id="activeHeading">Kelas saya</h2>
   {active.length?<ul className="classList">{active.map(item=><li key={item.id}><strong>{item.batch_title}</strong><span>{labels[item.status]}</span></li>)}</ul>:<p role="status">Belum ada kelas aktif.</p>}
  </section>
  <section aria-labelledby="sessionHeading" className="nextSection"><h2 id="sessionHeading">Sesi berikutnya</h2>
   {nextSession?<article className="nextCard"><strong>{nextSession.title}</strong><p>{nextSession.batch_title}</p><time dateTime={nextSession.starts_at}>{displayDate(nextSession.starts_at)}</time></article>:<p role="status">Jadwal sesi berikutnya belum tersedia.</p>}
   {upcoming.length>1?<details><summary>Lihat sesi mendatang ({upcoming.length-1})</summary><ul>{upcoming.slice(1).map(s=><li key={`${s.batch_id}-${s.id}`}><strong>{s.title}</strong><time dateTime={s.starts_at}>{displayDate(s.starts_at)}</time></li>)}</ul></details>:null}
  </section>
  {history.length?<details><summary>Riwayat dan pendaftaran lainnya ({history.length})</summary><ul>{history.map(item=><li key={item.id}><strong>{item.batch_title}</strong><span>{labels[item.status]??'Status tersedia di SPS'}</span></li>)}</ul></details>:null}
  <style>{`.mySps{display:grid;gap:1.5rem;font-family:inherit}.mySps h2{font-size:1.12rem;font-weight:600;margin:0 0 .75rem}.mySps .classList,.mySps ul{list-style:none;padding:0;margin:0}.mySps li{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:.85rem 0;border-bottom:1px solid #ccc}.mySps strong{font-weight:600}.mySps .nextCard{border:1px solid #bbb;border-radius:12px;padding:1rem;display:grid;gap:.25rem}.mySps .nextCard p{margin:.2rem 0}.mySps details{margin-top:1rem}.mySps summary{cursor:pointer;padding:.5rem 0}.mySps time{font-variant-numeric:tabular-nums}@media(max-width:600px){.mySps li{align-items:flex-start;flex-direction:column;gap:.3rem}}`}</style>
 </section>;
}
