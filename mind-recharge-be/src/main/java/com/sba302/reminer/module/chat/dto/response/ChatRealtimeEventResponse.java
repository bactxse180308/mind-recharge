package com.sba302.reminer.module.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRealtimeEventResponse {
    private String eventType;
    private ChatConversationResponse conversation;
    private ChatMessageResponse message;
    private ChatUserSummaryResponse typingUser;
    private Boolean typing;
}
