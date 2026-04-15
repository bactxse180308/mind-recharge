package com.sba302.reminer.module.chat.service;

import com.sba302.reminer.module.chat.dto.request.CallSignalRequest;

public interface CallSignalingService {

    void publishSignal(Long userId, CallSignalRequest request);
}
