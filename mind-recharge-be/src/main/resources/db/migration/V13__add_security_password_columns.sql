IF COL_LENGTH('users', 'security_password_hash') IS NULL
BEGIN
    ALTER TABLE users ADD security_password_hash NVARCHAR(255) NULL;
END;

IF COL_LENGTH('users', 'security_password_updated_at') IS NULL
BEGIN
    ALTER TABLE users ADD security_password_updated_at DATETIME2 NULL;
END;

IF COL_LENGTH('users', 'security_password_failed_attempts') IS NULL
BEGIN
    ALTER TABLE users ADD security_password_failed_attempts INT NOT NULL DEFAULT 0;
END;

IF COL_LENGTH('users', 'security_password_locked_until') IS NULL
BEGIN
    ALTER TABLE users ADD security_password_locked_until DATETIME2 NULL;
END;
