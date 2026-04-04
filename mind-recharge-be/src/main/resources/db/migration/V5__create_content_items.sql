-- V5__create_content_items.sql

-- ===== CONTENT ITEMS =====
CREATE TABLE content_items
(
    id           BIGSERIAL    NOT NULL PRIMARY KEY,
    content_type VARCHAR(40)  NOT NULL
        CONSTRAINT chk_content_type CHECK (
            content_type IN (
                'MOOD_RESPONSE', 'JOURNAL_MICROCOPY', 'TRIGGER_REMINDER',
                'QUOTE', 'MILESTONE_MESSAGE', 'DAILY_FEEDBACK'
            )
        ),
    content_key  VARCHAR(100) NOT NULL,
    text         TEXT         NOT NULL,
    extra_jsonb  JSONB,
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_content_type_key UNIQUE (content_type, content_key)
);

CREATE INDEX idx_content_type ON content_items (content_type, is_active);
CREATE INDEX idx_content_extra ON content_items USING gin (extra_jsonb);
