package com.sba302.reminer.module.friend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendFriendRequestRequest {

    @NotNull(message = "Receiver id is required")
    private Long receiverId;

    @Size(max = 255, message = "Request message must not exceed 255 characters")
    private String message;
}
