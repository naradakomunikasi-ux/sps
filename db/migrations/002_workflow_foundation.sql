-- CP003 ADDITIVE candidate migration; apply only after canonical schema reconciliation.
BEGIN;
CREATE TABLE IF NOT EXISTS workflow_case (
 id uuid PRIMARY KEY, enrollment_id uuid NOT NULL REFERENCES enrollment(id),
 state text NOT NULL CHECK(length(trim(state)) > 0),
 version integer NOT NULL DEFAULT 0 CHECK(version >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_case_enrollment_idx ON workflow_case(enrollment_id);
CREATE TABLE IF NOT EXISTS mutation_receipt (
 id uuid PRIMARY KEY, actor_person_id uuid NOT NULL REFERENCES person(id),
 operation text NOT NULL, idempotency_key text NOT NULL, request_hash text NOT NULL,
 response jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_person_id,operation,idempotency_key)
);
CREATE TABLE IF NOT EXISTS workflow_transition_log (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 case_id uuid NOT NULL REFERENCES workflow_case(id), actor_person_id uuid NOT NULL REFERENCES person(id),
 previous_state text NOT NULL, next_state text NOT NULL,
 correlation_id text NOT NULL, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workflow_transition_case_idx ON workflow_transition_log(case_id,occurred_at DESC);
COMMIT;
