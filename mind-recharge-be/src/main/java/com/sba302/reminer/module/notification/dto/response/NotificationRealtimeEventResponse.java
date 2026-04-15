package com.sba302.reminer.module.notification.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationRealtimeEventResponse {
    private String eventType;
    private long unreadCount;
    private NotificationResponse notification;
}
