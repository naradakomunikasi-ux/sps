# SPS Platform — Sekolah Penginjilan Supernatural

Full-stack application engineering project by MiyuStudio.id.

**Architecture:** Next.js / React / TypeScript (web), NestJS / TypeScript (API), PostgreSQL 16 (application data), SQLite (engineering checkpoints only).

**Principle:** One Person → One Master Profile → Multiple SPS Journeys. Server-side RoleContext, resource-scope permissions, default deny, workflow guard, audit trail, and human approval for consequential actions.

## Engineering status — CP-014 baseline

- Product design: controlled baseline.
- Coding engineering: in progress; 10/54 tasks at least implemented/tested (18.5% unweighted task count).
- Verified implementation: **0%**; G3 **HOLD**.
- Full-stack build, PostgreSQL migrations and UAT have not yet passed runtime validation.

Canonical specification and runnable UI/UX are maintained in the SPS Google Drive project. This GitHub repository stores code and engineering controls, not credentials or confidential participant data.

## Cost control (mandatory)

No paid GitHub services, Actions runs, Codespaces, hosted runners, deployments, marketplace purchases, or metered features without explicit owner approval. Do not add active `.github/workflows/` automation before verifying the available billing quota, spending limits, and receiving approval. Standard source commits alone do not require activating those services.

## Safety

Never commit `.env`, secrets, tokens, participant records, SQLite containing real personal data, `node_modules`, or generated build outputs. Pull requests and implementation changes must preserve security and evidence-based checkpoints.

## Reference links

- [UI/UX runnable baseline](https://drive.google.com/file/d/1quLTGs_Kix-4ARVVBzCwgxyLDfrgyqxc/view)
- [Sitemap and UI/UX specification](https://docs.google.com/document/d/1LQdkJ4pKiTdEr_-5z28aKhHFlLhF3E-7D11GYBIcuAA/edit)
- [Engineering checkpoint folder](https://drive.google.com/drive/folders/1Wsn1p5hSdqh3_003Mj7uXoB4uBUTMlNK)
