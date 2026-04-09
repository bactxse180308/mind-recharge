package com.sba302.reminer.common.event;

import com.sba302.reminer.common.enums.JournalMoodCode;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class JournalSavedEvent {
    private final Long journalEntryId;
    private final Long userId;
    private final String timezone;
    private final JournalMoodCode moodCode;
    private final String content;
    private final Instant entryAt;
}
