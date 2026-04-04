-- V1__create_users_and_refresh_tokens.sql
-- Mind Recharge - Initial Schema

-- ===== USERS =====
CREATE TABLE users
(
    id            BIGSERIAL                NOT NULL PRIMARY KEY,
    email         VARCHAR(255)             NOT NULL UNIQUE,
    password_hash VARCHAR(255)             NOT NULL,
    display_name  VARCHAR(100)             NOT NULL,
    timezone      VARCHAR(60)              NOT NULL DEFAULT 'UTC',
    locale        VARCHAR(10)              NOT NULL DEFAULT 'vi',
    status        VARCHAR(20)              NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- ===== REFRESH TOKENS =====
CREATE TABLE refresh_tokens
(
    id          BIGSERIAL                NOT NULL PRIMARY KEY,
    user_id     BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)             NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at  TIMESTAMP WITH TIME ZONE,
    device_name VARCHAR(200),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
