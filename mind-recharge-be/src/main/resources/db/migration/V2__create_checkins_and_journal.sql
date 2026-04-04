-- V2__create_checkins_and_journal.sql

-- ===== DAILY CHECK-INS =====
CREATE TABLE daily_checkins
(
    id           BIGSERIAL                NOT NULL PRIMARY KEY,
    user_id      BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    checkin_date DATE                     NOT NULL,
    mood_level   VARCHAR(20)              NOT NULL
        CONSTRAINT chk_checkin_mood CHECK (mood_level IN ('BAD', 'NEUTRAL', 'BETTER')),
    response_key VARCHAR(100)             NOT NULL,
    note         TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT uq_daily_checkins_user_date UNIQUE (user_id, checkin_date)
);

CREATE INDEX idx_daily_checkins_user_id ON daily_checkins (user_id);
CREATE INDEX idx_daily_checkins_date ON daily_checkins (checkin_date);

-- ===== JOURNAL ENTRIES =====
CREATE TABLE journal_entries
(
    id         BIGSERIAL                NOT NULL PRIMARY KEY,
    user_id    BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mood_code  VARCHAR(20)              NOT NULL
        CONSTRAINT chk_journal_mood CHECK (mood_code IN ('SAD', 'NEUTRAL', 'BETTER', 'CALM', 'LOVE')),
    content    TEXT                     NOT NULL,
    entry_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_journal_user_id ON journal_entries (user_id);
CREATE INDEX idx_journal_entry_at ON journal_entries (entry_at DESC);
CREATE INDEX idx_journal_not_deleted ON journal_entries (user_id, entry_at DESC) WHERE deleted_at IS NULL;
