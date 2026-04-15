CREATE TABLE notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    type VARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    body NVARCHAR(500) NOT NULL,
    is_read BIT NOT NULL CONSTRAINT df_notifications_is_read DEFAULT 0,
    read_at DATETIME2 NULL,
    conversation_id BIGINT NULL,
    message_id BIGINT NULL,
    payload_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT df_notifications_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT df_notifications_updated_at DEFAULT SYSUTCDATETIME()
);

CREATE INDEX idx_notifications_user_created
    ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_conversation
    ON notifications(conversation_id);

CREATE INDEX idx_notifications_message
    ON notifications(message_id);

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users(id);
