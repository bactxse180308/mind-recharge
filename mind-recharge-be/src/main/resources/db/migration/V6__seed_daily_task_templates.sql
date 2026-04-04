-- V6__seed_daily_task_templates.sql

INSERT INTO daily_task_templates (code, title, emoji, sort_order, is_active)
VALUES ('DRINK_WATER',    'Uống đủ 8 ly nước',                  '💧', 1, TRUE),
       ('SHORT_WALK',     'Đi bộ ít nhất 10 phút',              '🚶', 2, TRUE),
       ('DEEP_BREATH',    'Hít thở sâu 5 lần',                  '🌬️', 3, TRUE),
       ('NO_PHONE_30MIN', 'Không nhìn điện thoại 30 phút',      '📵', 4, TRUE),
       ('KIND_TO_SELF',   'Làm một điều tốt cho bản thân hôm nay', '🌻', 5, TRUE);
