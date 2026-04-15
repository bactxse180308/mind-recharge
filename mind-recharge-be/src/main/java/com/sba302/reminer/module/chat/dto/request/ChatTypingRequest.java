package com.sba302.reminer.module.chat.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatTypingRequest {

    @NotNull
    private Long conversationId;

    @NotNull
    private Boolean typing;
}
