-- V5__create_content_items.sql

-- ===== CONTENT ITEMS =====
CREATE TABLE content_items
(
    id           BIGINT       NOT NULL PRIMARY KEY IDENTITY(1,1),
    content_type VARCHAR(40)  NOT NULL
        CONSTRAINT chk_content_type CHECK (
            content_type IN (
                             'MOOD_RESPONSE', 'JOURNAL_MICROCOPY', 'TRIGGER_REMINDER',
                             'QUOTE', 'MILESTONE_MESSAGE', 'DAILY_FEEDBACK'
                )
            ),
    content_key  VARCHAR(100)  NOT NULL,
    text         NVARCHAR(MAX) NOT NULL,
    extra_jsonb  NVARCHAR(MAX),
    sort_order   INT          NOT NULL DEFAULT 0,
    is_active    BIT          NOT NULL DEFAULT 1,
    CONSTRAINT uq_content_type_key UNIQUE (content_type, content_key)
);

CREATE INDEX idx_content_type ON content_items (content_type, is_active);
CREATE INDEX idx_content_extra ON content_items (extra_jsonb);
