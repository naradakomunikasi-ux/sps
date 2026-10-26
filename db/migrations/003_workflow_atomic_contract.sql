-- Service workflow requirements: check expected_version and permission before mutation; on duplicate receipt return recorded response without reapplying.
-- Service requirement: INSERT workflow_transition_log and audit_event in same transaction; rollback on failures.
-- CP005 corrected index contract; prior CP004 index referenced nonexistent columns.
-- Schema remains CANDIDATE pending canonical review and PostgreSQL execution.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_workflow_transition_log_case_time
 ON workflow_transition_log (case_id, occurred_at DESC);
COMMIT;
