package com.sba302.reminer.module.unsent.service;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import com.sba302.reminer.module.unsent.dto.request.CreateUnsentMessageRequest;
import com.sba302.reminer.module.unsent.dto.response.UnsentMessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UnsentMessageService {

    UnsentMessageResponse create(Long userId, CreateUnsentMessageRequest request);

    Page<UnsentMessageResponse> list(Long userId, UnsentMessageStatus status, Pageable pageable);

    UnsentMessageResponse release(Long userId, Long id);

    void delete(Long userId, Long id);
}
