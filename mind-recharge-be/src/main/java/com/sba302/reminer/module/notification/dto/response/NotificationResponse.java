package com.sba302.reminer.module.notification.dto.response;

import com.sba302.reminer.common.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String title;
    private String body;
    private boolean isRead;
    private Instant readAt;
    private Long conversationId;
    private Long messageId;
    private String payloadJson;
    private NotificationActorResponse actor;
    private Instant createdAt;
    private Instant updatedAt;
}
