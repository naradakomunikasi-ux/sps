-- CP005 candidate: requires canonical schema approval before execution.
BEGIN;
CREATE TABLE IF NOT EXISTS auth_session (
 id uuid PRIMARY KEY, user_account_id uuid NOT NULL REFERENCES user_account(id),
 token_hash text NOT NULL UNIQUE CHECK(length(token_hash)=64),
 issued_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, CHECK(expires_at>issued_at),
 CHECK(revoked_at IS NULL OR revoked_at>=issued_at)
);
CREATE INDEX IF NOT EXISTS auth_session_account_active_idx
 ON auth_session(user_account_id,expires_at) WHERE revoked_at IS NULL;
COMMIT;
