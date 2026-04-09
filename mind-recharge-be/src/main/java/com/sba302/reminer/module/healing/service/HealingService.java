package com.sba302.reminer.module.healing.service;

import com.sba302.reminer.common.event.JournalSavedEvent;
import com.sba302.reminer.module.healing.dto.response.HealingTimelineResponse;

public interface HealingService {
    void handleJournalSavedEvent(JournalSavedEvent event);
    
    HealingTimelineResponse getTimeline(Long userId, int days);
}
