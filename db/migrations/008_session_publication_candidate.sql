-- CP025: publication gate for participant My SPS session previews.
-- Candidate only: DO NOT report applied until PostgreSQL 16 runtime evidence exists.
BEGIN;
ALTER TABLE learning_session ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'DRAFT';
ALTER TABLE learning_session DROP CONSTRAINT IF EXISTS learning_session_publication_status_ck;
ALTER TABLE learning_session ADD CONSTRAINT learning_session_publication_status_ck
 CHECK (publication_status IN ('DRAFT','PUBLISHED','ARCHIVED'));
CREATE INDEX IF NOT EXISTS learning_session_published_idx
 ON learning_session(batch_id, starts_at) WHERE publication_status = 'PUBLISHED';
COMMIT;
