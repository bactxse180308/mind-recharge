-- V9__seed_more_daily_task_templates.sql

-- Thêm một số nhiệm vụ nhỏ (daily tasks) giúp việc chữa lành nhẹ nhàng hơn
INSERT INTO daily_task_templates (code, title, emoji, sort_order, is_active)
VALUES ('WRITE_JOURNAL',    N'Viết ra một điều bạn đang cảm thấy', N'📝', 6, 1),
       ('DRINK_TEA',        N'Uống một tách trà hoặc nước ấm',     N'🍵', 7, 1),
       ('LISTEN_MUSIC',     N'Nghe một bản nhạc chữa lành',        N'🎵', 8, 1),
       ('SMILE_MIRROR',     N'Mỉm cười với bản thân trong gương',  N'✨', 9, 1),
       ('STRETCH_BODY',     N'Vươn vai và thư giãn cơ thể',        N'🧘‍♀️', 10, 1);
