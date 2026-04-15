package com.sba302.reminer.module.friend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class FriendshipResponse {
    private Long friendshipId;
    private FriendUserSummaryResponse friend;
    private Instant createdAt;
}
