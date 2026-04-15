package com.sba302.reminer.module.friend.dto.response;

import com.sba302.reminer.common.enums.FriendRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FriendRequestResponse {
    private Long id;
    private FriendUserSummaryResponse sender;
    private FriendUserSummaryResponse receiver;
    private String message;
    private FriendRequestStatus status;
    private Instant respondedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
