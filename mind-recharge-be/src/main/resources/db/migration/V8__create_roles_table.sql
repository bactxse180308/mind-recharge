-- V8__create_roles_table.sql

-- ===== ROLES =====
CREATE TABLE roles
(
    id          BIGINT        NOT NULL PRIMARY KEY IDENTITY(1,1),
    role_name   VARCHAR(50)   NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active   BIT           NOT NULL DEFAULT 1,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX idx_roles_role_name ON roles (role_name);
CREATE INDEX idx_roles_is_active ON roles (is_active);

-- ===== ADD ROLE COLUMN TO USERS (NULLABLE FIRST) =====
ALTER TABLE users
ADD role_id BIGINT;

-- ===== INSERT DEFAULT ROLES =====
INSERT INTO roles (role_name, description, is_active)
VALUES
    ('ADMIN', 'Administrator with full system access', 1),
    ('USER', 'Regular user account', 1);

-- ===== UPDATE EXISTING USERS WITH DEFAULT ROLE (USER) =====
UPDATE users
SET role_id = (SELECT id FROM roles WHERE role_name = 'USER')
WHERE role_id IS NULL;

-- ===== SET ROLE_ID TO NOT NULL =====
ALTER TABLE users
ALTER COLUMN role_id BIGINT NOT NULL;

-- ===== CREATE FOREIGN KEY CONSTRAINT =====
ALTER TABLE users
ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);

-- ===== ADD INDEX =====
CREATE INDEX idx_users_role_id ON users (role_id);



