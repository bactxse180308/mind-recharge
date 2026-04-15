package com.sba302.reminer.module.journal.dto.response;

import com.sba302.reminer.common.enums.JournalMoodCode;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class JournalResponse {
    private Long id;
    private JournalMoodCode moodCode;
    private String content;
    private Instant entryAt;
    private Instant createdAt;
    private Instant updatedAt;
}
