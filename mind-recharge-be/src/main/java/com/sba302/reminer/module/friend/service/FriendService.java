package com.sba302.reminer.module.friend.service;

import com.sba302.reminer.module.friend.dto.request.SendFriendRequestRequest;
import com.sba302.reminer.module.friend.dto.response.FriendRequestResponse;
import com.sba302.reminer.module.friend.dto.response.FriendSearchResponse;
import com.sba302.reminer.module.friend.dto.response.FriendshipResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FriendService {

    FriendRequestResponse sendRequest(Long userId, SendFriendRequestRequest request);

    FriendRequestResponse acceptRequest(Long userId, Long requestId);

    FriendRequestResponse rejectRequest(Long userId, Long requestId);

    FriendRequestResponse cancelRequest(Long userId, Long requestId);

    Page<FriendRequestResponse> listIncomingRequests(Long userId, Pageable pageable);

    Page<FriendRequestResponse> listOutgoingRequests(Long userId, Pageable pageable);

    Page<FriendshipResponse> listFriends(Long userId, Pageable pageable);

    Page<FriendSearchResponse> searchUsers(Long userId, String keyword, Pageable pageable);
}
