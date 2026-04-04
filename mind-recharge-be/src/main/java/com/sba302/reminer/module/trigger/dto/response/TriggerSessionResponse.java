package com.sba302.reminer.module.trigger.dto.response;

import com.sba302.reminer.common.enums.TriggerSessionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class TriggerSessionResponse {
    private Long id;
    private TriggerSessionStatus status;
    private Integer durationSeconds;
    private Instant startedAt;
    private Instant endedAt;
    private Instant createdAt;
}
