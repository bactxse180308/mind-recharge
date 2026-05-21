package com.sba302.reminer.module.journal.dto.request;

import com.sba302.reminer.common.enums.JournalMoodCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class CreateJournalRequest {

    @NotNull(message = "Mood code is required")
    private JournalMoodCode moodCode;

    @NotBlank(message = "Content is required")
    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    private String content;

    /** Client-side timestamp; defaults to server time if null. */
    private Instant entryAt;
}
