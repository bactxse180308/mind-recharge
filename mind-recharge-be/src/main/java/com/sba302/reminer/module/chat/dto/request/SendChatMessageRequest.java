package com.sba302.reminer.module.chat.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendChatMessageRequest {

    @Size(max = 4000, message = "Message content must not exceed 4000 characters")
    private String content;

    private String imageUrl;

    private String imageKey;
}
