-- ========================================================
-- BERRY FRESH CORE — MIGRATION 000007: OUTBOX & AUDIT
-- ========================================================

-- Transactional Outbox (Guarantees At-Least-Once Delivery to RabbitMQ)
CREATE TABLE IF NOT EXISTS audit.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- e.g. 'pos.transaction.completed', 'receiving.completed'
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER')),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Fast Index for Outbox Worker polling pending events
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON audit.outbox_events (status, created_at ASC) WHERE status = 'PENDING';

-- Transactional Inbox (Guarantees Idempotent Message Consumption)
CREATE TABLE IF NOT EXISTS audit.inbox_events (
    message_id VARCHAR(150) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    consumer_name VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (Enterprise Administrative Actions & Security)
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES identity.users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    changes JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
