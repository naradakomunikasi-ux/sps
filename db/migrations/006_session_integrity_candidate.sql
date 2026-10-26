-- CP007 CANDIDATE: requires canonical schema approval and PostgreSQL migration run.
BEGIN;
CREATE INDEX IF NOT EXISTS auth_session_token_expiry_idx ON auth_session(token_hash,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS role_assignment_batch_lookup_idx ON role_assignment(batch_id,role_code) WHERE enabled=TRUE;
COMMIT;
