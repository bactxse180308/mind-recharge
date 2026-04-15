package com.sba302.reminer.module.notification.dto.request;

import com.sba302.reminer.common.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateNotificationRequest {
    private Long userId;
    private Long actorUserId;
    private NotificationType type;
    private String title;
    private String body;
    private Long conversationId;
    private Long messageId;
    private String payloadJson;
}
