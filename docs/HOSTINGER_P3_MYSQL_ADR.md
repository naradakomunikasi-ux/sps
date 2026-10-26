# ADR — Hostinger Web App P3 + Managed MySQL (candidate)

**Decision direction:** Align deployment to already-owned Hostinger Web App P3 using managed MySQL. No VPS purchase.

**Architecture:** Next.js frontend, NestJS backend (hosting two apps must be validated per plan), MySQL 8/InnoDB, HTTPS, hPanel-managed environment variables.

**State:** CANDIDATE; not approved for production. PostgreSQL 16 source migrations and `pg` repositories remain the canonical baseline pending explicit adapter port and parity tests.

**Required P0 work:** (1) MySQL `mysql2/promise` repository implementation; (2) rewrite PostgreSQL-specific queries and migrations; (3) test transaction, locking, idempotency and RBAC equivalence; (4) build and HTTP E2E on Hostinger staging; (5) verify two Node.js app processes are supported; (6) backup and restore.

**Risk:** `CHAR(36)` UUID vs PG uuid, `?` placeholders, MySQL nullable UNIQUE semantics, JSON functions, date timezone, default/constraint differences. Never mark these as automatically compatible.

**Deployment:** Use separate staging DB and apps. GitHub import does not imply deployment authorization. Check and disable automatic deploy before connecting `main`; use ZIP staging for first controlled validation if needed.
