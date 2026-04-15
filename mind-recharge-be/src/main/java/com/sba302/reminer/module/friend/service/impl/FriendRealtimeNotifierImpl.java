package com.sba302.reminer.module.friend.service.impl;

import com.sba302.reminer.module.friend.dto.response.FriendRealtimeEventResponse;
import com.sba302.reminer.module.friend.service.FriendRealtimeNotifier;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class FriendRealtimeNotifierImpl implements FriendRealtimeNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void notifyUser(Long userId, FriendRealtimeEventResponse event) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/friends", event);
    }
}
