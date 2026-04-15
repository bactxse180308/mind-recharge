-- V1__create_users_and_refresh_tokens.sql
-- Mind Recharge - Initial Schema

-- ===== USERS =====
CREATE TABLE users
(
    id            BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    email         VARCHAR(255)             NOT NULL UNIQUE,
    password_hash VARCHAR(255)             NOT NULL,
    display_name  VARCHAR(100)             NOT NULL,
    timezone      VARCHAR(60)              NOT NULL DEFAULT 'UTC',
    locale        VARCHAR(10)              NOT NULL DEFAULT 'vi',
    status        VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at    DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    updated_at    DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE(),
    last_login_at DATETIMEOFFSET
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- ===== REFRESH TOKENS =====
CREATE TABLE refresh_tokens
(
    id          BIGINT                   NOT NULL PRIMARY KEY IDENTITY(1,1),
    user_id     BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)             NOT NULL UNIQUE,
    expires_at  DATETIMEOFFSET           NOT NULL,
    revoked_at  DATETIMEOFFSET,
    device_name VARCHAR(200),
    created_at  DATETIMEOFFSET           NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
