package com.sba302.reminer.module.nocontact.service;

import com.sba302.reminer.module.nocontact.dto.request.ResetJourneyRequest;
import com.sba302.reminer.module.nocontact.dto.response.NoContactJourneyResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NoContactService {

    NoContactJourneyResponse getCurrent(Long userId);

    NoContactJourneyResponse start(Long userId);

    NoContactJourneyResponse reset(Long userId, ResetJourneyRequest request);

    Page<NoContactJourneyResponse> history(Long userId, Pageable pageable);
}
