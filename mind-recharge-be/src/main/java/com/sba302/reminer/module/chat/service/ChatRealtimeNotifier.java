package com.sba302.reminer.module.chat.service;

import com.sba302.reminer.module.chat.dto.response.ChatRealtimeEventResponse;

public interface ChatRealtimeNotifier {
    void notifyUser(Long userId, ChatRealtimeEventResponse event);
}
