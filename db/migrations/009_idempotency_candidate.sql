BEGIN;
CREATE TABLE IF NOT EXISTS sps_idempotency(
 actor_id uuid NOT NULL,
 idempotency_key varchar(128) NOT NULL,
 request_hash char(64) NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 status varchar(16) NOT NULL CHECK(status IN ('PROCESSING','COMPLETED')),
 http_status integer CHECK(http_status BETWEEN 200 AND 599),
 response_body jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 PRIMARY KEY(actor_id,idempotency_key),
 CHECK ((status='PROCESSING' AND completed_at IS NULL AND http_status IS NULL) OR (status='COMPLETED' AND completed_at IS NOT NULL AND http_status IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS sps_idempotency_created_idx ON sps_idempotency(created_at);
COMMIT;
