package com.sba302.reminer.module.journal.dto.request;

import com.sba302.reminer.common.enums.JournalMoodCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateJournalRequest {

    private JournalMoodCode moodCode;

    private String content;
}
