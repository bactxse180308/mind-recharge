package com.sba302.reminer.module.friend.service;

import com.sba302.reminer.module.friend.dto.response.FriendRealtimeEventResponse;

public interface FriendRealtimeNotifier {
    void notifyUser(Long userId, FriendRealtimeEventResponse event);
}
