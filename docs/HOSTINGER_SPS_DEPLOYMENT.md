# SPS Platform — Hostinger P3 Deployment Contract (CP-029 CANDIDATE)

Source template: MiyuStudio Hostinger Node.js / Express + SQLite Deployment Template v1.0, pp.1–4. This document ADAPTS its packaging and runtime practices; it does **not** change SPS architecture to Express+SQLite.

## Deployment architecture
- Web: Next.js/React, npm workspace `@sps/web`.
- API: NestJS/Node.js, npm workspace `@sps/api`.
- Primary application database: **PostgreSQL 16**. SQLite is restricted to engineering checkpoint archives and never packaged as application data.
- Target: Hostinger P3 Full Stack if its actual runtime/build/deployment capability and access to an external PostgreSQL database pass a proof-of-concept. Otherwise evaluate P5 KVM4 + container stack through formal ADR; do not silently migrate architecture.
- Redis, long-running workers, persistent background jobs and multi-process deployment support are **unverified**. Do not promise these features on P3 without platform testing.

## Source and import
- GitHub: `https://github.com/naradakomunikasi-ux/sps`, default branch `main`.
- Root has `package.json`, npm workspaces and `engines.node >=20`.
- Install `npm ci` **only after a real lockfile is generated and committed**; do not fabricate one. Production builds require `npm run build`.
- This monorepo is **not** a drop-in `server.js` Express project. Hostinger's supported multi-service orchestration and independent start commands for API and Next.js must be established by POC. Root `npm start` targets API only and is insufficient for full-stack deployment.
- Configure separate service port(s) and trusted internal API URL; NestJS listens on `process.env.PORT`. Never derive internal API destinations from request Host header.

## Environment
Required: `NODE_ENV`, `PORT` (platform assigned), `DATABASE_URL`, `SPS_INTERNAL_API_URL`. Configure in Hostinger secret/env UI; never commit real values. Public Next.js environment variables must not carry session tokens, credentials or database URL. Token and RoleContext validated server-side. Enable TLS/HTTPS, safe cookies and authorization at API boundary.

## Readiness gates and commands
1. `npm ci` success with committed lockfile.
2. `npm run check:hostinger`; `npm run typecheck`; `npm run build`.
3. PostgreSQL 16 migrations 001–008 applied to isolated dev DB; backup and restore demonstrated; rollback and DB accessibility tested.
4. Next.js BFF → NestJS → PostgreSQL HTTP test, including expired/revoked session, cross-person, cross-batch, and error recovery.
5. Hostinger P3 import POC: verify detected Node version, two-service routing, health check, resource limits, HTTPS, secrets, process restart, persistent worker feasibility (if needed), logs and rollback.
6. Browser QA desktop/tablet/mobile and stakeholder acceptance.

## Cost restriction
Do not enable GitHub Actions, Codespaces, Hostinger upgrades, third-party databases, paid services or any metered hosted resources without explicit owner approval. Source-only tests and Git commits are permitted. Deployment POC requires platform and cost review first.

## G3 status
HOLD: npm registry/network failure, missing dependency lockfile, unexecuted PostgreSQL 16 migrations, missing end-to-end and P3 deployment POC. This contract is not proof of deployment capability.
