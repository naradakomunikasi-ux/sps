-- SPS Platform PostgreSQL 16 initial schema / CP-002. Applies to an EMPTY dedicated database.
BEGIN;
CREATE TABLE person (
 id uuid PRIMARY KEY, full_name text NOT NULL CHECK(length(trim(full_name)) > 0),
 email text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX person_email_casefold_uq ON person (lower(email)) WHERE email IS NOT NULL;
CREATE TABLE user_account (
 id uuid PRIMARY KEY, person_id uuid NOT NULL UNIQUE REFERENCES person(id) ON DELETE RESTRICT,
 external_subject text UNIQUE, enabled boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sps_batch (
 id uuid PRIMARY KEY, code text NOT NULL UNIQUE, title text NOT NULL,
 starts_at timestamptz, ends_at timestamptz,
 CONSTRAINT valid_batch_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);
CREATE TABLE role_assignment (
 id uuid PRIMARY KEY, user_account_id uuid NOT NULL REFERENCES user_account(id),
 role_code text NOT NULL, batch_id uuid REFERENCES sps_batch(id), enabled boolean NOT NULL DEFAULT true,
 UNIQUE(user_account_id,role_code,batch_id)
);
CREATE TABLE enrollment (
 id uuid PRIMARY KEY, person_id uuid NOT NULL REFERENCES person(id), batch_id uuid NOT NULL REFERENCES sps_batch(id),
 status text NOT NULL CHECK (status IN ('APPLIED','REVIEW','APPROVED','ACTIVE','WITHDRAWN','COMPLETED')),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(person_id,batch_id)
);
CREATE TABLE learning_session (
 id uuid PRIMARY KEY, batch_id uuid NOT NULL REFERENCES sps_batch(id), title text NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, CHECK(ends_at>starts_at)
);
CREATE TABLE attendance (
 id uuid PRIMARY KEY, enrollment_id uuid NOT NULL REFERENCES enrollment(id),
 session_id uuid NOT NULL REFERENCES learning_session(id), status text NOT NULL
 CHECK(status IN ('NO_DATA','PRESENT','ABSENT','EXCUSED','REVIEW')),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(enrollment_id,session_id)
);
CREATE TABLE audit_event (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor_person_id uuid REFERENCES person(id),
 action text NOT NULL, entity_type text NOT NULL, entity_id uuid, correlation_id text NOT NULL,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb, occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enrollment_batch_idx ON enrollment(batch_id,status);
CREATE INDEX learning_session_batch_idx ON learning_session(batch_id,starts_at);
CREATE INDEX attendance_session_idx ON attendance(session_id,status);
CREATE INDEX audit_event_entity_idx ON audit_event(entity_type,entity_id,occurred_at DESC);
COMMIT;
