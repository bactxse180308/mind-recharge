package com.sba302.reminer.module.nocontact.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NoContactStatsResponse {
    private long longestStreakDays;
    private int totalResets;
}
