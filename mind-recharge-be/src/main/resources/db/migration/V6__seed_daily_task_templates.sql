-- V6__seed_daily_task_templates.sql

INSERT INTO daily_task_templates (code, title, emoji, sort_order, is_active)
VALUES ('DRINK_WATER',    N'Uống đủ 8 ly nước',                  N'💧', 1, 1),
       ('SHORT_WALK',     N'Đi bộ ít nhất 10 phút',              N'🚶', 2, 1),
       ('DEEP_BREATH',    N'Hít thở sâu 5 lần',                  N'🌬️', 3, 1),
       ('NO_PHONE_30MIN', N'Không nhìn điện thoại 30 phút',      N'📵', 4, 1),
       ('KIND_TO_SELF',   N'Làm một điều tốt cho bản thân hôm nay', N'🌻', 5, 1);
