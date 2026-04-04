-- V7__seed_content_items.sql

-- MOOD RESPONSES (check-in hôm nay)
INSERT INTO content_items (content_type, content_key, text, sort_order, is_active)
VALUES
('MOOD_RESPONSE', 'BAD_1',     'Hôm nay khó khăn, nhưng bạn vẫn ở đây. Đó là đủ rồi. 💙', 1, TRUE),
('MOOD_RESPONSE', 'BAD_2',     'Cảm xúc nặng nề là bình thường. Hãy thở chậm và nhẹ nhàng với bản thân.', 2, TRUE),
('MOOD_RESPONSE', 'NEUTRAL_1', 'Một ngày bình thường cũng là một ngày bạn tiến về phía trước. 🌿', 1, TRUE),
('MOOD_RESPONSE', 'NEUTRAL_2', 'Trung tính không có nghĩa là đứng yên — bạn đang dần ổn định hơn.', 2, TRUE),
('MOOD_RESPONSE', 'BETTER_1',  'Tuyệt vời! Hôm nay bạn tốt hơn một chút rồi đó. Giữ vững nhé! 🌟', 1, TRUE),
('MOOD_RESPONSE', 'BETTER_2',  'Cảm giác tốt hơn là dấu hiệu bạn đang chữa lành. Tiếp tục nhé!', 2, TRUE),

-- TRIGGER REMINDERS
('TRIGGER_REMINDER', 'REMIND_01', 'Dừng lại 10 phút. Cảm xúc này sẽ qua. Bạn không cần phải hành động ngay bây giờ.', 1, TRUE),
('TRIGGER_REMINDER', 'REMIND_02', 'Hãy hít thở. Những gì bạn cảm thấy là thật — nhưng quyết định có thể đợi.', 2, TRUE),
('TRIGGER_REMINDER', 'REMIND_03', 'Nhắn tin đó sẽ không mang lại điều bạn thực sự cần. Hãy ở lại đây với bản thân.', 3, TRUE),
('TRIGGER_REMINDER', 'REMIND_04', 'Bạn đã cố gắng rất nhiều. 10 phút này là dành cho bạn.', 4, TRUE),
('TRIGGER_REMINDER', 'REMIND_05', 'Cảm xúc không phải là sự thật. Nó sẽ thay đổi. Bạn đủ mạnh để chờ.', 5, TRUE),

-- MILESTONE MESSAGES
('MILESTONE_MESSAGE', 'DAY_1',  '🎉 1 ngày không liên lạc! Bước đầu tiên luôn khó nhất.',       1,  TRUE),
('MILESTONE_MESSAGE', 'DAY_3',  '🌱 3 ngày rồi! Bạn đang tạo ra không gian cho bản thân.',       3,  TRUE),
('MILESTONE_MESSAGE', 'DAY_7',  '⭐ 1 tuần! Não bộ bạn đang dần tái lập trật tự mới.',           7,  TRUE),
('MILESTONE_MESSAGE', 'DAY_14', '💪 2 tuần! Bạn mạnh hơn bạn nghĩ rất nhiều.',                   14, TRUE),
('MILESTONE_MESSAGE', 'DAY_30', '🏆 30 ngày! Một tháng bạn đã chọn bản thân mình.',              30, TRUE),
('MILESTONE_MESSAGE', 'DAY_60', '🌟 60 ngày! Bạn đang xây dựng lại chính mình từng ngày.',       60, TRUE),
('MILESTONE_MESSAGE', 'DAY_90', '🦋 90 ngày! Bạn đã vượt qua. Bạn xứng đáng với điều tốt đẹp.', 90, TRUE),

-- QUOTES
('QUOTE', 'QUOTE_01', 'Chữa lành không phải là đường thẳng. Nhưng bạn đang đi đúng hướng.', 1, TRUE),
('QUOTE', 'QUOTE_02', 'Bạn không cần phải xóa ký ức, chỉ cần học cách sống cùng chúng.',     2, TRUE),
('QUOTE', 'QUOTE_03', 'Yêu bản thân là bước đầu tiên của bất kỳ hành trình chữa lành nào.', 3, TRUE),
('QUOTE', 'QUOTE_04', 'Cảm giác đau không có nghĩa là bạn đang thất bại.',                    4, TRUE),
('QUOTE', 'QUOTE_05', 'Mỗi ngày bạn chọn bản thân là một chiến thắng nhỏ.',                   5, TRUE),

-- DAILY FEEDBACK
('DAILY_FEEDBACK', 'TASKS_ALL_DONE',    'Bạn đã hoàn thành tất cả! Hôm nay bạn thực sự tuyệt vời 🌟',          1, TRUE),
('DAILY_FEEDBACK', 'TASKS_HALF_DONE',   'Đã làm được nửa rồi! Mỗi bước nhỏ đều quan trọng 💚',                  2, TRUE),
('DAILY_FEEDBACK', 'TASKS_NONE_DONE',   'Hôm nay chưa bắt đầu? Chỉ cần làm một việc nhỏ thôi nhé 🌱',          3, TRUE),

-- JOURNAL MICROCOPIES
('JOURNAL_MICROCOPY', 'PLACEHOLDER',    'Hôm nay bạn cảm thấy thế nào? Viết ra bất cứ điều gì trong lòng...', 1, TRUE),
('JOURNAL_MICROCOPY', 'SAVED',          'Đã lưu. Cảm ơn bạn đã dành thời gian cho bản thân hôm nay 💙',       2, TRUE),
('JOURNAL_MICROCOPY', 'HIGHLIGHT_HINT', 'Nhìn lại mình cách đây vài ngày...',                                  3, TRUE);
