package com.sba302.reminer.module.unsent.dto.response;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class UnsentMessageResponse {
    private Long id;
    /**
     * Message content — included so the user can see their own messages.
     * Never logged anywhere in the application.
     */
    private String content;
    private String imageUrl;
    private String imageKey;
    private UnsentMessageStatus status;
    private Instant releasedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
