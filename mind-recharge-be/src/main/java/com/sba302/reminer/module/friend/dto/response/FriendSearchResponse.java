package com.sba302.reminer.module.friend.dto.response;

import com.sba302.reminer.common.enums.FriendRelationStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FriendSearchResponse {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String avatarKey;
    private FriendRelationStatus relationStatus;
}
