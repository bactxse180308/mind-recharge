package com.sba302.reminer.module.notification.service;

import com.sba302.reminer.module.notification.dto.response.NotificationRealtimeEventResponse;

public interface NotificationRealtimeNotifier {
    void notifyUser(Long userId, NotificationRealtimeEventResponse event);
}
