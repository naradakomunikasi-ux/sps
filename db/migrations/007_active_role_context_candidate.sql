-- CP012 candidate: requires PostgreSQL 16 integration and canonical approval.
BEGIN;
ALTER TABLE auth_session ADD COLUMN IF NOT EXISTS active_role_code text;
-- Default deny: existing sessions remain without active role until server-side selection.
CREATE INDEX IF NOT EXISTS auth_session_active_role_idx
 ON auth_session(user_account_id,active_role_code) WHERE revoked_at IS NULL;
COMMIT;
