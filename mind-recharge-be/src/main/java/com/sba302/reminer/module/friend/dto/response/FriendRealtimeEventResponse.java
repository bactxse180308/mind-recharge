package com.sba302.reminer.module.friend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendRealtimeEventResponse {
    private String eventType;
    private FriendRequestResponse request;
    private FriendshipResponse friendship;
}
