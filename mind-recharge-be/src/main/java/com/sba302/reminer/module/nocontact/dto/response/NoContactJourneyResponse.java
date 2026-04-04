package com.sba302.reminer.module.nocontact.dto.response;

import com.sba302.reminer.common.enums.JourneyStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class NoContactJourneyResponse {
    private Long id;
    private JourneyStatus status;
    private Instant startedAt;
    private Instant endedAt;
    private String resetReason;
    private Long streakDays;
    private List<Integer> achievedMilestones;
    private Instant createdAt;
    private Instant updatedAt;
}
