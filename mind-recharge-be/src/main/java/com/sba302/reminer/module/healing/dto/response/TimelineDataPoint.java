package com.sba302.reminer.module.healing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineDataPoint {
    private LocalDate date;
    private Double score;
    private String moodLabel;
    private String message;
}
