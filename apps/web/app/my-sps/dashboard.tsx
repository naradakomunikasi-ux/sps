type Enrollment={id:string;batch_title:string;status:string};
const labels:Record<string,string>={ACTIVE:'In progress',COMPLETED:'Completed',PENDING:'Pending',WITHDRAWN:'Withdrawn'};
export function EnrollmentDashboard({items}:{items:Enrollment[]}) {
 const active=items.filter(item=>item.status==='ACTIVE').length;
 return <section aria-label="My SPS overview"><div className="summary" aria-label="Enrollment summary"><article><h2>My SPS journeys</h2><strong>{items.length}</strong></article><article><h2>Active batches</h2><strong>{active}</strong></article></div><h2>My enrollments</h2><ul>{items.map(item=><li key={item.id}><strong>{item.batch_title}</strong><span>{labels[item.status]??item.status}</span></li>)}</ul><p>Session details and materials appear after your batch has been published.</p><style>{`.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.summary article{border:1px solid #c9c9c9;border-radius:12px;padding:1rem}.summary strong{font-size:1.75rem}li{display:flex;flex-wrap:wrap;gap:.75rem;justify-content:space-between;padding:.75rem 0;border-bottom:1px solid #ddd}`}</style></section>;
}
