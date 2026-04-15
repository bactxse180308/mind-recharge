package com.sba302.reminer.module.chat.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class CallSignalResponse {
    private String eventType;
    private String signalType;
    private Long conversationId;
    private String callId;
    private ChatUserSummaryResponse fromUser;
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
    private String reason;
    private Instant createdAt;
}
