package com.sba302.reminer.module.nocontact.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class DailyLogResponse {
    private Long id;
    private LocalDate logDate;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
}
