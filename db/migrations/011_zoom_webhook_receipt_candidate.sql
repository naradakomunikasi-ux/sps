-- CP061: durable Zoom webhook replay protection; append-only event receipts.
BEGIN;
CREATE TABLE IF NOT EXISTS zoom_webhook_receipt (
 event_id char(64) PRIMARY KEY CHECK (event_id ~ '^[a-f0-9]{64}$'),
 received_at timestamptz NOT NULL DEFAULT now(),
 source_timestamp timestamptz NOT NULL,
 body jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS zoom_webhook_receipt_received_idx ON zoom_webhook_receipt(received_at);
COMMIT;
