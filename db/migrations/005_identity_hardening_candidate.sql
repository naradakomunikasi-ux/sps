-- CP006 candidate; apply only after physical-schema reconciliation and review.
-- A role assignment must be unique even when batch_id is NULL (PostgreSQL 15+).
BEGIN;
ALTER TABLE role_assignment DROP CONSTRAINT IF EXISTS role_assignment_user_account_id_role_code_batch_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS role_assignment_effective_key_uq
 ON role_assignment (user_account_id,role_code,batch_id) NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS enrollment_person_created_idx ON enrollment(person_id,created_at DESC);
CREATE INDEX IF NOT EXISTS role_assignment_account_enabled_idx ON role_assignment(user_account_id,enabled);
COMMIT;
