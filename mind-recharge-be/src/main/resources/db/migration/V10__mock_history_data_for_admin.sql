-- V10__mock_history_data_for_admin.sql
-- Hỗ trợ seed dữ liệu (Daily Tasks và Check-ins) cho 7 ngày qua đối với tài khoản admin mặc định (user_id = 1) để test Lịch sử / Thống kê.

DECLARE @UserId BIGINT = 1;
DECLARE @Now DATETIME = GETDATE();

-- Chỉ chạy nếu tồn tại User 1
IF EXISTS (SELECT 1 FROM users WHERE id = @UserId)
BEGIN

    -- =========================================================================
    -- 1. Thêm lịch sử Daily Tasks cho 7 ngày qua
    -- Ngày -1
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -1, @Now) AS DATE), 1, DATEADD(day, -1, @Now), DATEADD(day, -1, @Now), DATEADD(day, -1, @Now)
    FROM daily_task_templates WHERE id IN (1, 2, 4);

    -- Ngày -2
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -2, @Now) AS DATE), 1, DATEADD(day, -2, @Now), DATEADD(day, -2, @Now), DATEADD(day, -2, @Now)
    FROM daily_task_templates WHERE id IN (1, 2, 3, 5);

    -- Ngày -3
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -3, @Now) AS DATE), 1, DATEADD(day, -3, @Now), DATEADD(day, -3, @Now), DATEADD(day, -3, @Now)
    FROM daily_task_templates WHERE id IN (1, 4, 7);

    -- Ngày -4
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -4, @Now) AS DATE), 1, DATEADD(day, -4, @Now), DATEADD(day, -4, @Now), DATEADD(day, -4, @Now)
    FROM daily_task_templates WHERE id IN (2, 3, 4, 6);

    -- Ngày -5
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -5, @Now) AS DATE), 1, DATEADD(day, -5, @Now), DATEADD(day, -5, @Now), DATEADD(day, -5, @Now)
    FROM daily_task_templates WHERE id IN (1, 5);

    -- Ngày -6
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -6, @Now) AS DATE), 1, DATEADD(day, -6, @Now), DATEADD(day, -6, @Now), DATEADD(day, -6, @Now)
    FROM daily_task_templates WHERE id IN (1, 2, 3, 4, 5);

    -- Ngày -7
    INSERT INTO daily_task_logs (user_id, task_template_id, task_date, is_done, done_at, created_at, updated_at)
    SELECT @UserId, id, CAST(DATEADD(day, -7, @Now) AS DATE), 1, DATEADD(day, -7, @Now), DATEADD(day, -7, @Now), DATEADD(day, -7, @Now)
    FROM daily_task_templates WHERE id IN (2, 4);

    -- =========================================================================
    -- 2. Thêm lịch sử Check-ins cho 7 ngày qua (để chart nhìn sinh động)
    INSERT INTO daily_checkins (user_id, checkin_date, mood_level, response_key, note, created_at, updated_at)
    VALUES 
        (@UserId, CAST(DATEADD(day, -1, @Now) AS DATE), 'BETTER',  'DEFAULT_BETTER', N'Thấy nhẹ nhõm hơn đôi chút', DATEADD(day, -1, @Now), DATEADD(day, -1, @Now)),
        (@UserId, CAST(DATEADD(day, -2, @Now) AS DATE), 'NEUTRAL', 'DEFAULT_NEUTRAL', N'Một ngày bình thường, không quá tệ', DATEADD(day, -2, @Now), DATEADD(day, -2, @Now)),
        (@UserId, CAST(DATEADD(day, -3, @Now) AS DATE), 'BAD',     'DEFAULT_BAD', N'Hơi buồn và nhớ người đó', DATEADD(day, -3, @Now), DATEADD(day, -3, @Now)),
        (@UserId, CAST(DATEADD(day, -4, @Now) AS DATE), 'BETTER',  'DEFAULT_BETTER', N'Có thời gian đi dạo với bạn bè', DATEADD(day, -4, @Now), DATEADD(day, -4, @Now)),
        (@UserId, CAST(DATEADD(day, -5, @Now) AS DATE), 'NEUTRAL', 'DEFAULT_NEUTRAL', N'Tập trung vào công việc', DATEADD(day, -5, @Now), DATEADD(day, -5, @Now)),
        (@UserId, CAST(DATEADD(day, -6, @Now) AS DATE), 'BAD',     'DEFAULT_BAD', N'Thấy trống trải vào buổi tối', DATEADD(day, -6, @Now), DATEADD(day, -6, @Now)),
        (@UserId, CAST(DATEADD(day, -7, @Now) AS DATE), 'BETTER',  'DEFAULT_BETTER', N'Bắt đầu quyết tâm chữa lành', DATEADD(day, -7, @Now), DATEADD(day, -7, @Now));

END
