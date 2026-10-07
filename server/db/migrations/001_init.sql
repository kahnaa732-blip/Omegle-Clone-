-- Haven Operational Schema (PostgreSQL 14+)
-- Privacy-by-Design Architecture: Zero PII, Salted IP Hashes, Ephemeral Retention

CREATE TABLE IF NOT EXISTS session_records (
    session_id VARCHAR(64) PRIMARY KEY,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    tier VARCHAR(32) DEFAULT 'NORMAL',
    skip_count INT DEFAULT 0,
    last_active_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON session_records(expires_at);

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY,
    reporter_session_id VARCHAR(64) NOT NULL,
    reported_session_id VARCHAR(64) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    details VARCHAR(300),
    timestamp BIGINT NOT NULL,
    status VARCHAR(32) DEFAULT 'PENDING'
);

CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS bans (
    id VARCHAR(64) PRIMARY KEY,
    target_session_id VARCHAR(64),
    ip_hash VARCHAR(64),
    reason VARCHAR(128) NOT NULL,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bans_ip_hash ON bans(ip_hash);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);

CREATE TABLE IF NOT EXISTS blocked_pairs (
    pair_key VARCHAR(130) PRIMARY KEY,
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_pairs_expires ON blocked_pairs(expires_at);
