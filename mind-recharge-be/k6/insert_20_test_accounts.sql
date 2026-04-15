SET NOCOUNT ON;

/*
Default login for all inserted test accounts:
  password: User@123456

Accounts created:
  loadtest01@mindrecharge.com
  ...
  loadtest20@mindrecharge.com

Safe to run multiple times:
  existing emails are skipped, so it will not conflict with the unique index on users.email
*/

DECLARE @DefaultPasswordHash VARCHAR(255) = '$2a$10$0qT7/hMsQ8DitEOJ8KdsIuGQyh3t2VlIqI3QBtHCIEuYX.FQjiodG';
DECLARE @UserRoleId BIGINT;
DECLARE @InsertColumns NVARCHAR(MAX);
DECLARE @SelectColumns NVARCHAR(MAX);
DECLARE @Sql NVARCHAR(MAX);

SELECT TOP (1) @UserRoleId = id
FROM roles
WHERE role_name = 'USER'
  AND ISNULL(is_active, 1) = 1
ORDER BY id;

IF @UserRoleId IS NULL
BEGIN
    THROW 50000, 'USER role not found in table roles.', 1;
END;

IF OBJECT_ID('tempdb..#SeedUsers') IS NOT NULL
BEGIN
    DROP TABLE #SeedUsers;
END;

CREATE TABLE #SeedUsers
(
    email        VARCHAR(255) NOT NULL PRIMARY KEY,
    display_name NVARCHAR(100) NOT NULL,
    timezone     VARCHAR(60) NOT NULL,
    locale       VARCHAR(10) NOT NULL
);

INSERT INTO #SeedUsers (email, display_name, timezone, locale)
VALUES
    ('loadtest01@mindrecharge.com', N'Load Test User 01', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest02@mindrecharge.com', N'Load Test User 02', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest03@mindrecharge.com', N'Load Test User 03', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest04@mindrecharge.com', N'Load Test User 04', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest05@mindrecharge.com', N'Load Test User 05', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest06@mindrecharge.com', N'Load Test User 06', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest07@mindrecharge.com', N'Load Test User 07', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest08@mindrecharge.com', N'Load Test User 08', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest09@mindrecharge.com', N'Load Test User 09', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest10@mindrecharge.com', N'Load Test User 10', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest11@mindrecharge.com', N'Load Test User 11', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest12@mindrecharge.com', N'Load Test User 12', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest13@mindrecharge.com', N'Load Test User 13', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest14@mindrecharge.com', N'Load Test User 14', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest15@mindrecharge.com', N'Load Test User 15', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest16@mindrecharge.com', N'Load Test User 16', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest17@mindrecharge.com', N'Load Test User 17', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest18@mindrecharge.com', N'Load Test User 18', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest19@mindrecharge.com', N'Load Test User 19', 'Asia/Ho_Chi_Minh', 'vi'),
    ('loadtest20@mindrecharge.com', N'Load Test User 20', 'Asia/Ho_Chi_Minh', 'vi');

SET @InsertColumns = N'email, password_hash, display_name, timezone, locale, status, role_id';
SET @SelectColumns = N'su.email, @DefaultPasswordHash, su.display_name, su.timezone, su.locale, ''ACTIVE'', @UserRoleId';

IF COL_LENGTH('users', 'created_at') IS NOT NULL
BEGIN
    SET @InsertColumns += N', created_at';
    SET @SelectColumns += N', TODATETIMEOFFSET(SYSUTCDATETIME(), ''+00:00'')';
END;

IF COL_LENGTH('users', 'updated_at') IS NOT NULL
BEGIN
    SET @InsertColumns += N', updated_at';
    SET @SelectColumns += N', TODATETIMEOFFSET(SYSUTCDATETIME(), ''+00:00'')';
END;

IF COL_LENGTH('users', 'last_login_at') IS NOT NULL
BEGIN
    SET @InsertColumns += N', last_login_at';
    SET @SelectColumns += N', NULL';
END;

IF COL_LENGTH('users', 'security_password_hash') IS NOT NULL
BEGIN
    SET @InsertColumns += N', security_password_hash';
    SET @SelectColumns += N', NULL';
END;

IF COL_LENGTH('users', 'security_password_updated_at') IS NOT NULL
BEGIN
    SET @InsertColumns += N', security_password_updated_at';
    SET @SelectColumns += N', NULL';
END;

IF COL_LENGTH('users', 'security_password_failed_attempts') IS NOT NULL
BEGIN
    SET @InsertColumns += N', security_password_failed_attempts';
    SET @SelectColumns += N', 0';
END;

IF COL_LENGTH('users', 'security_password_locked_until') IS NOT NULL
BEGIN
    SET @InsertColumns += N', security_password_locked_until';
    SET @SelectColumns += N', NULL';
END;

IF COL_LENGTH('users', 'avatar_url') IS NOT NULL
BEGIN
    SET @InsertColumns += N', avatar_url';
    SET @SelectColumns += N', NULL';
END;

IF COL_LENGTH('users', 'avatar_key') IS NOT NULL
BEGIN
    SET @InsertColumns += N', avatar_key';
    SET @SelectColumns += N', NULL';
END;

SET @Sql = N'
INSERT INTO users (' + @InsertColumns + N')
SELECT ' + @SelectColumns + N'
FROM #SeedUsers su
WHERE NOT EXISTS (
    SELECT 1
    FROM users u
    WHERE u.email = su.email
);';

EXEC sp_executesql
    @Sql,
    N'@DefaultPasswordHash VARCHAR(255), @UserRoleId BIGINT',
    @DefaultPasswordHash = @DefaultPasswordHash,
    @UserRoleId = @UserRoleId;

SELECT
    u.id,
    u.email,
    u.display_name,
    u.status,
    u.role_id
FROM users u
WHERE u.email LIKE 'loadtest%@mindrecharge.com'
ORDER BY u.email;
