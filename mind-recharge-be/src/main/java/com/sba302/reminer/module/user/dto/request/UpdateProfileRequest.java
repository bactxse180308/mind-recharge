package com.sba302.reminer.module.user.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Size(min = 1, max = 100, message = "Display name must be 1–100 characters")
    private String displayName;

    /** IANA timezone string, e.g. "Asia/Ho_Chi_Minh" */
    private String timezone;

    private String locale;

    private String avatarUrl;

    private String avatarKey;
}
