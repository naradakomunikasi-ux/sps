# SPS Platform — Hostinger P3 Deployment Contract (CP-029 CANDIDATE)

Based on MiyuStudio Hostinger Node.js/Express+SQLite Deployment Template v1.0. SPS does **not** adopt Express or SQLite as its application backend/database.

## SPS stack
- Frontend: Next.js/React workspace `@sps/web`.
- Backend: NestJS/Node.js workspace `@sps/api`.
- Application database: PostgreSQL 16. SQLite is only for engineering checkpoints.
- Target: Hostinger P3 Full Stack **pending POC** of two-service runtime, PostgreSQL connectivity, restart, process model, and secret management. P5 KVM4 as alternative requires ADR and owner approval.

## Source and commands
GitHub `naradakomunikasi-ux/sps`, branch `main`. Node >=20, npm workspaces and root `package.json`. Run `npm ci` only with real committed lockfile, then `npm run typecheck`, `npm run build` and local tests. Hostinger must support distinct Next.js and NestJS processes; root `npm start` alone cannot serve the full stack. No assumption of supported workers/Redis/BullMQ.

## Runtime and security
NestJS must read `process.env.PORT`. Set `DATABASE_URL`, `SPS_INTERNAL_API_URL`, `NODE_ENV` in hosting secrets. Never expose credentials via `NEXT_PUBLIC_*` or trust request Host for internal API targets. Enable HTTPS, secure cookies, DB-backed sessions, server-side RoleContext/resource scope, logging and health checks.

## Release acceptance
1. Lockfile, npm ci, typecheck, production builds PASS.
2. PostgreSQL16 migrations 001–008 and rollback/backup-restore verified on isolated development database.
3. Real Next.js BFF → NestJS → PostgreSQL HTTP E2E, negative auth tests and browser responsive QA PASS.
4. Hostinger P3 POC confirms multi-service routing, health, environment secrets, DB accessibility, restart, log and rollback; separately confirm worker capabilities if required.
5. Security and stakeholder signoff. Until then G3 HOLD.

## Cost policy
Do not activate GitHub Actions, Codespaces, Hostinger upgrades, managed databases, paid resources or metered services without explicit owner approval. Source commits and local checks only.
