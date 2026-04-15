package com.sba302.reminer.module.notification.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationActorResponse {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String avatarKey;
}
