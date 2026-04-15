package com.sba302.reminer.module.chat.service.impl;

import com.sba302.reminer.module.chat.dto.response.ChatRealtimeEventResponse;
import com.sba302.reminer.module.chat.service.ChatRealtimeNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ChatRealtimeNotifierImpl implements ChatRealtimeNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void notifyUser(Long userId, ChatRealtimeEventResponse event) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/chat", event);
    }
}
