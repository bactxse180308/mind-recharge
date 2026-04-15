package com.sba302.reminer.module.notification.service.impl;

import com.sba302.reminer.module.notification.dto.response.NotificationRealtimeEventResponse;
import com.sba302.reminer.module.notification.service.NotificationRealtimeNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class NotificationRealtimeNotifierImpl implements NotificationRealtimeNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void notifyUser(Long userId, NotificationRealtimeEventResponse event) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", event);
    }
}
