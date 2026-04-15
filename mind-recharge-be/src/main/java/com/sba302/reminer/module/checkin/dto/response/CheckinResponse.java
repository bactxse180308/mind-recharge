package com.sba302.reminer.module.checkin.dto.response;

import com.sba302.reminer.common.enums.MoodLevel;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class CheckinResponse {
    private Long id;
    private LocalDate checkinDate;
    private MoodLevel moodLevel;
    private String responseKey;
    private String responseText;   // populated from content_items at service level
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
