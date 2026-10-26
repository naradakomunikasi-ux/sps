-- CP035 candidate: immutable Zoom evidence inbox; never writes canonical attendance.
BEGIN;
CREATE TABLE IF NOT EXISTS zoom_evidence_inbox (
 id uuid PRIMARY KEY,
 source_event_id text NOT NULL,
 meeting_id text NOT NULL,
 participant_external_id text NOT NULL,
 fingerprint char(64) NOT NULL UNIQUE CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
 payload jsonb NOT NULL,
 state text NOT NULL DEFAULT 'PENDING_RECONCILIATION' CHECK (state IN ('PENDING_RECONCILIATION','READY_FOR_REVIEW','UNMATCHED','AMBIGUOUS','REJECTED','APPROVED')),
 candidate_person_id uuid REFERENCES person(id),
 received_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid REFERENCES person(id),
 review_note text,
 CHECK ((reviewed_at IS NULL AND reviewed_by IS NULL) OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)),
 CHECK (state NOT IN ('APPROVED','REJECTED') OR (reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL AND length(trim(review_note)) > 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS zoom_evidence_source_event_uq ON zoom_evidence_inbox(source_event_id);
CREATE INDEX IF NOT EXISTS zoom_evidence_pending_idx ON zoom_evidence_inbox(state,received_at) WHERE state NOT IN ('APPROVED','REJECTED');
COMMIT;
