package com.sba302.reminer.module.chat.dto.response;

import com.sba302.reminer.common.enums.ChatConversationType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class ChatConversationResponse {
    private Long id;
    private ChatConversationType type;
    private ChatUserSummaryResponse counterpart;
    private List<ChatUserSummaryResponse> participants;
    private ChatMessageResponse lastMessage;
    private long unreadCount;
    private Instant counterpartLastReadAt;
    private Instant lastMessageAt;
    private Instant createdAt;
    private Instant updatedAt;
}
