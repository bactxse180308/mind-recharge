package com.sba302.reminer.module.checkin.dto.request;

import com.sba302.reminer.common.enums.MoodLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckinRequest {

    @NotNull(message = "Mood level is required")
    private MoodLevel moodLevel;

    private String note;
}
