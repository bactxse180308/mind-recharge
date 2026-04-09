-- V3__create_unsent_messages_and_no_contact.sql

-- ===== UNSENT MESSAGES =====
CREATE TABLE unsent_messages
(
    id          BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    user_id     BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content     TEXT                     NOT NULL,
    status      VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_unsent_status CHECK (status IN ('ACTIVE', 'RELEASED', 'DELETED')),
    released_at DATETIMEOFFSET,
    created_at  DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    deleted_at  DATETIMEOFFSET
);

CREATE INDEX idx_unsent_user_id ON unsent_messages (user_id);
CREATE INDEX idx_unsent_user_status ON unsent_messages (user_id, status) WHERE deleted_at IS NULL;

-- ===== NO CONTACT JOURNEYS =====
CREATE TABLE no_contact_journeys
(
    id           BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    user_id      BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    started_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    ended_at     DATETIMEOFFSET,
    status       VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_journey_status CHECK (status IN ('ACTIVE', 'RESET', 'COMPLETED')),
    reset_reason TEXT,
    created_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    updated_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_no_contact_user_id ON no_contact_journeys (user_id);
CREATE INDEX idx_no_contact_active ON no_contact_journeys (user_id, status) WHERE status = 'ACTIVE';

-- ===== NO CONTACT MILESTONE EVENTS =====
CREATE TABLE no_contact_milestone_events
(
    id            BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    journey_id    BIGINT                   NOT NULL REFERENCES no_contact_journeys (id) ON DELETE CASCADE,
    milestone_day INT                      NOT NULL,
    achieved_at   DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT uq_milestone_journey_day UNIQUE (journey_id, milestone_day)
);

CREATE INDEX idx_milestone_journey_id ON no_contact_milestone_events (journey_id);
