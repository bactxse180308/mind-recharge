-- V2__create_checkins_and_journal.sql

-- ===== DAILY CHECK-INS =====
CREATE TABLE daily_checkins
(
    id           BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    user_id      BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    checkin_date DATE                     NOT NULL,
    mood_level   VARCHAR(20)              NOT NULL
        CONSTRAINT chk_checkin_mood CHECK (mood_level IN ('BAD', 'NEUTRAL', 'BETTER')),
    response_key VARCHAR(100)             NOT NULL,
    note         TEXT,
    created_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    updated_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT uq_daily_checkins_user_date UNIQUE (user_id, checkin_date)
);

CREATE INDEX idx_daily_checkins_user_id ON daily_checkins (user_id);
CREATE INDEX idx_daily_checkins_date ON daily_checkins (checkin_date);

-- ===== JOURNAL ENTRIES =====
CREATE TABLE journal_entries
(
    id         BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    user_id    BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mood_code  VARCHAR(20)              NOT NULL
        CONSTRAINT chk_journal_mood CHECK (mood_code IN ('SAD', 'NEUTRAL', 'BETTER', 'CALM', 'LOVE')),
    content    TEXT                     NOT NULL,
    entry_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    created_at DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    deleted_at DATETIMEOFFSET
);

CREATE INDEX idx_journal_user_id ON journal_entries (user_id);
CREATE INDEX idx_journal_entry_at ON journal_entries (entry_at DESC);
CREATE INDEX idx_journal_not_deleted ON journal_entries (user_id) WHERE deleted_at IS NULL;
