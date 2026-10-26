# SPS MySQL migration candidate — Hostinger Web App P3

This is a **staging-only candidate** schema for MySQL 8 / InnoDB, not an assertion of production readiness.

1. hPanel → Websites → your Node.js app → Databases → Management → Create MySQL DB.
2. Preserve **full prefixed** DB name and username. Prefer `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` configured only in hPanel secrets.
3. In phpMyAdmin select the new empty DB and import `001_sps_hostinger_staging.sql`. Check `SHOW TABLES;` and foreign keys.
4. DO NOT use existing PostgreSQL `db/migrations/*.sql` on MySQL. The current NestJS repositories depend on PostgreSQL (`pg`, `$1`, JSONB, `RETURNING`, `::uuid`, partial indexes); **they have not been ported**. Switching the URL alone will not work.
5. Stage database and backend compatibility work first; prohibit production data and do not claim migration applied.
6. Reconcile SQL constraints, role scope, audit columns and approval workflow before data migration or production.

Security: do not commit real credentials or use remote root DB credentials. Back up any target data before import.

After deployment dependencies are installed, run `npm run db:mysql:verify` with DB_* environment variables. This command reads schema only and never creates tables.
