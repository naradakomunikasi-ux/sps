-- SPS MySQL 8 candidate schema for Hostinger Web App P3.
-- Execute ONLY against a NEW/EMPTY SPS staging database. Review before production.
-- NOT a translation of all 11 PostgreSQL migrations; DB adapters must be migrated separately.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS person (
 id CHAR(36) PRIMARY KEY, full_name VARCHAR(250) NOT NULL,
 email VARCHAR(320) NULL, email_key VARCHAR(320) GENERATED ALWAYS AS (LOWER(email)) STORED,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_person_email_key (email_key)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS user_account (
 id CHAR(36) PRIMARY KEY, person_id CHAR(36) NOT NULL UNIQUE,
 external_subject VARCHAR(255) UNIQUE, enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (person_id) REFERENCES person(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sps_batch (
 id CHAR(36) PRIMARY KEY, code VARCHAR(100) NOT NULL UNIQUE, title VARCHAR(250) NOT NULL,
 starts_at DATETIME(3), ends_at DATETIME(3),
 CONSTRAINT ck_batch_dates CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at>=starts_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS role_assignment (
 id CHAR(36) PRIMARY KEY, user_account_id CHAR(36) NOT NULL,
 role_code VARCHAR(40) NOT NULL, batch_id CHAR(36) NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE,
 -- unique nullable key semantics differ from PostgreSQL; application must enforce global-role uniqueness.
 UNIQUE KEY uq_role_assignment (user_account_id,role_code,batch_id),
 FOREIGN KEY (user_account_id) REFERENCES user_account(id),
 FOREIGN KEY (batch_id) REFERENCES sps_batch(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS enrollment (
 id CHAR(36) PRIMARY KEY, person_id CHAR(36) NOT NULL, batch_id CHAR(36) NOT NULL,
 status ENUM('APPLIED','REVIEW','APPROVED','ACTIVE','WITHDRAWN','COMPLETED') NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_enrollment_person_batch (person_id,batch_id),
 FOREIGN KEY (person_id) REFERENCES person(id), FOREIGN KEY (batch_id) REFERENCES sps_batch(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS learning_session (
 id CHAR(36) PRIMARY KEY, batch_id CHAR(36) NOT NULL, title VARCHAR(255) NOT NULL,
 starts_at DATETIME(3) NOT NULL, ends_at DATETIME(3) NOT NULL,
 publication_status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
 CONSTRAINT ck_session_dates CHECK (ends_at>starts_at),
 KEY idx_session_published (batch_id,publication_status,starts_at),
 FOREIGN KEY (batch_id) REFERENCES sps_batch(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS attendance (
 id CHAR(36) PRIMARY KEY, enrollment_id CHAR(36) NOT NULL, session_id CHAR(36) NOT NULL,
 status ENUM('NO_DATA','PRESENT','ABSENT','EXCUSED','REVIEW') NOT NULL,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_attendance_enrollment_session (enrollment_id,session_id),
 FOREIGN KEY (enrollment_id) REFERENCES enrollment(id), FOREIGN KEY (session_id) REFERENCES learning_session(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS auth_session (
 id CHAR(36) PRIMARY KEY, user_account_id CHAR(36) NOT NULL,
 token_hash CHAR(64) NOT NULL UNIQUE, issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 expires_at DATETIME(3) NOT NULL, revoked_at DATETIME(3),
 active_role_code VARCHAR(40),
 KEY idx_auth_active (user_account_id,revoked_at,expires_at),
 FOREIGN KEY (user_account_id) REFERENCES user_account(id),
 CONSTRAINT ck_auth_expiry CHECK (expires_at>issued_at)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS workflow_case (
 id CHAR(36) PRIMARY KEY, enrollment_id CHAR(36) NOT NULL,
 state VARCHAR(100) NOT NULL, version INT NOT NULL DEFAULT 0,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY (enrollment_id) REFERENCES enrollment(id), CHECK(version>=0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS mutation_receipt (
 id CHAR(36) PRIMARY KEY, actor_person_id CHAR(36) NOT NULL,
 operation VARCHAR(120) NOT NULL, idempotency_key VARCHAR(160) NOT NULL,
 request_hash CHAR(64) NOT NULL, response JSON NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_mutation_receipt (actor_person_id,operation,idempotency_key),
 FOREIGN KEY (actor_person_id) REFERENCES person(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS audit_event (
 id CHAR(36) PRIMARY KEY, actor_person_id CHAR(36) NULL,
 action VARCHAR(120) NOT NULL, resource_type VARCHAR(120) NULL,
 resource_id VARCHAR(255) NULL, correlation_id VARCHAR(128),
 details JSON NULL, occurred_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY idx_audit_occurred (occurred_at), FOREIGN KEY (actor_person_id) REFERENCES person(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS zoom_evidence_inbox (
 id CHAR(36) PRIMARY KEY, source_event_id VARCHAR(190) NOT NULL UNIQUE,
 meeting_id VARCHAR(128) NOT NULL, participant_external_id VARCHAR(128) NOT NULL,
 fingerprint CHAR(64) NOT NULL UNIQUE, payload JSON NOT NULL,
 state ENUM('PENDING_RECONCILIATION','READY_FOR_REVIEW','UNMATCHED','AMBIGUOUS','REJECTED','APPROVED') NOT NULL DEFAULT 'PENDING_RECONCILIATION',
 candidate_person_id CHAR(36) NULL, received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 reviewed_at DATETIME(3), reviewed_by CHAR(36), review_note TEXT,
 KEY idx_zoom_evidence_state (state,received_at),
 FOREIGN KEY (candidate_person_id) REFERENCES person(id),
 FOREIGN KEY (reviewed_by) REFERENCES person(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS zoom_webhook_receipt (
 event_id CHAR(64) PRIMARY KEY, received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 source_timestamp DATETIME(3) NOT NULL, body JSON NOT NULL,
 KEY idx_zoom_received (received_at)
) ENGINE=InnoDB;
