package com.sba302.reminer.module.trigger.service;

import com.sba302.reminer.module.trigger.dto.response.TriggerSessionResponse;

public interface TriggerSessionService {

    TriggerSessionResponse start(Long userId);

    TriggerSessionResponse complete(Long userId, Long sessionId);

    TriggerSessionResponse cancel(Long userId, Long sessionId);

    TriggerSessionResponse redirectToUnsent(Long userId, Long sessionId);
}
