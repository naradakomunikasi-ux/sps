/** Pure view model: only existing enrollments and published sessions; no invented activities. */
export type SessionPreview = { id: string; title: string; starts_at: string | null; status: string };
export type EnrollmentPreview = { id: string; batch_title: string; status: string; sessions?: SessionPreview[] };
export function summarizeMySps(items: EnrollmentPreview[] | null | undefined, now: number = Date.now()) {
  const rows: EnrollmentPreview[] = Array.isArray(items) ? items : [];
  const valid = rows.filter(x => x && typeof x === 'object' && typeof x.id === 'string' && typeof x.batch_title === 'string');
  const active = valid.filter(x => x.status === 'ACTIVE');
  const sessions = active.flatMap(enrollment => (Array.isArray(enrollment.sessions) ? enrollment.sessions : []).filter(s => s && s.status === 'PUBLISHED' && typeof s.title === 'string' && typeof s.starts_at === 'string' && Number.isFinite(Date.parse(s.starts_at)) && Date.parse(s.starts_at) >= now).map(s => ({ id:s.id, title:s.title, starts_at:s.starts_at, batch_title:enrollment.batch_title, batch_id:enrollment.id })));
  sessions.sort((a,b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || String(a.id).localeCompare(String(b.id)));
  return { active, history:valid.filter(x => x.status !== 'ACTIVE'), nextSession:sessions[0] ?? null, upcoming:sessions.slice(0,5) };
}
