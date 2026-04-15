package com.sba302.reminer.module.user.dto.response;

import com.sba302.reminer.common.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String displayName;
    private String timezone;
    private String locale;
    private String avatarUrl;
    private String avatarKey;
    private UserStatus status;
    private Instant createdAt;
    private Instant lastLoginAt;
}
