package com.sba302.reminer.module.healing.dto.response;

import com.sba302.reminer.common.enums.HealingTrend;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealingTimelineResponse {
    private Integer streak;
    private HealingTrend trend;
    private Double avgScore;
    private List<TimelineDataPoint> timeline;
    private List<TimelineMilestone> milestones;
}
