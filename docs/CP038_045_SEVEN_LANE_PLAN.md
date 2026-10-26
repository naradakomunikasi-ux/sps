# SPS CP-038–CP-045 — 7-lane engineering evidence and remediation plan

GitHub push is explicitly on hold until >=50% implementation coverage AND user's subsequent approval; crossing the percentage never authorizes automatic upload.

| CP | Focus | Local deliverable | Exit evidence still required |
|---|---|---|---|
| 038 | Backend + Security | Dedicated strict role request parser, wired into controller | Real HTTP + PG authorization integration |
| 039 | QA | Negative input regression for role code, extra fields, correlation id | NestJS e2e tests |
| 040 | DB | Review candidate migration inventory 001–010 | PostgreSQL 16 transactional application |
| 041 | Integration | Review Zoom inbox and evidence boundary | Signed webhook + PostgreSQL write path |
| 042 | Frontend | Audit My SPS API contract and role-state behavior | Responsive browser run |
| 043 | DevOps | Installability and Hostinger contract readiness checks | npm ci/build P3 runtime |
| 044 | Governance | G01–G08 closure checklist and no-GitHub staging rule | ADR and approval |
| 045 | QA + release | Local regression and SQLite checkpoint archive | Build, PG, HTTP E2E, role UAT |

## Stop conditions
- No production API or DB claims unless tested on running services.
- Zoom evidence never authorizes canonical attendance writes.
- No secrets, .env, node_modules, or git credentials in deliverables.
- 50% implementation coverage requires >=27 of 54 tasks genuinely IMPLEMENTED/TESTED (current baseline 21).
- G3 stays HOLD and VERIFIED=0 until observable runtime evidence.
