package com.sba302.reminer.module.chat.dto.response;

import com.sba302.reminer.common.enums.ChatMessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private ChatMessageType type;
    private String content;
    private String imageUrl;
    private String imageKey;
    private ChatUserSummaryResponse sender;
    private boolean mine;
    private Instant createdAt;
    private Instant updatedAt;
}
