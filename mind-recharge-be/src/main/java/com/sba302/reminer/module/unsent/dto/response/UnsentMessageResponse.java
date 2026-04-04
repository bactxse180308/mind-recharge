package com.sba302.reminer.module.unsent.dto.response;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class UnsentMessageResponse {
    private Long id;
    private UnsentMessageStatus status;
    private Instant releasedAt;
    private Instant createdAt;
    private Instant updatedAt;
    // NOTE: content is intentionally omitted from list responses for privacy;
    // only returned on creation so the user sees what they wrote immediately.
}
