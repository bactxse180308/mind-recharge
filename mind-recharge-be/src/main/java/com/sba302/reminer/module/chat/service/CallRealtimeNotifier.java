package com.sba302.reminer.module.chat.service;

import com.sba302.reminer.module.chat.dto.response.CallSignalResponse;

public interface CallRealtimeNotifier {

    void notifyUser(Long userId, CallSignalResponse event);
}
