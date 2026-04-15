package com.sba302.reminer.module.chat.service.impl;

import com.sba302.reminer.module.chat.dto.response.CallSignalResponse;
import com.sba302.reminer.module.chat.service.CallRealtimeNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class CallRealtimeNotifierImpl implements CallRealtimeNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void notifyUser(Long userId, CallSignalResponse event) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/call", event);
    }
}
