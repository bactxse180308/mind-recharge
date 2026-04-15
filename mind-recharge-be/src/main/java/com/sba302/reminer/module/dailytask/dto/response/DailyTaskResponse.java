package com.sba302.reminer.module.dailytask.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class DailyTaskResponse {
    private Long templateId;
    private String code;
    private String title;
    private String emoji;
    private int sortOrder;
    private LocalDate taskDate;
    private boolean isDone;
    private Instant doneAt;
}
