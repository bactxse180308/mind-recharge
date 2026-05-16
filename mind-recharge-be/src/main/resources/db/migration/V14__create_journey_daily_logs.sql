-- V14__create_journey_daily_logs.sql

CREATE TABLE journey_daily_logs
(
    id         BIGINT        NOT NULL PRIMARY KEY IDENTITY(1,1),
    journey_id BIGINT        NOT NULL REFERENCES no_contact_journeys (id) ON DELETE CASCADE,
    user_id    BIGINT        NOT NULL REFERENCES users (id),
    log_date   DATE          NOT NULL,
    content    NVARCHAR(MAX) NOT NULL,
    created_at DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT uq_log_journey_date UNIQUE (journey_id, log_date)
);

CREATE INDEX idx_daily_log_journey_id ON journey_daily_logs (journey_id);
