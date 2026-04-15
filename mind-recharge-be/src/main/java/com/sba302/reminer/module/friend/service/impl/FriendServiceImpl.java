package com.sba302.reminer.module.friend.service.impl;

import com.sba302.reminer.common.enums.FriendRelationStatus;
import com.sba302.reminer.common.enums.FriendRequestStatus;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.friend.dto.request.SendFriendRequestRequest;
import com.sba302.reminer.module.friend.dto.response.*;
import com.sba302.reminer.module.friend.entity.FriendRequest;
import com.sba302.reminer.module.friend.entity.Friendship;
import com.sba302.reminer.module.friend.repository.FriendRequestRepository;
import com.sba302.reminer.module.friend.repository.FriendRequestSpecification;
import com.sba302.reminer.module.friend.repository.FriendshipRepository;
import com.sba302.reminer.module.friend.repository.FriendshipSpecification;
import com.sba302.reminer.module.friend.service.FriendRealtimeNotifier;
import com.sba302.reminer.module.friend.service.FriendService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import com.sba302.reminer.module.user.repository.UserSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class FriendServiceImpl implements FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final FriendRealtimeNotifier realtimeNotifier;

    @Override
    @Transactional
    public FriendRequestResponse sendRequest(Long userId, SendFriendRequestRequest request) {
        if (userId.equals(request.getReceiverId())) {
            throw AppException.badRequest("You cannot send a friend request to yourself");
        }

        User sender = findUser(userId);
        User receiver = findUser(request.getReceiverId());
        ensureNotFriends(userId, request.getReceiverId());

        List<FriendRequest> pending = friendRequestRepository.findAll(
                FriendRequestSpecification.pendingBetweenUsers(userId, request.getReceiverId()),
                Sort.by("createdAt").descending()
        );
        if (!pending.isEmpty()) {
            throw AppException.conflict("A pending friend request already exists between these users");
        }

        FriendRequest entity = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .requestMessage(StringUtils.hasText(request.getMessage()) ? request.getMessage().trim() : null)
                .status(FriendRequestStatus.PENDING)
                .build();
        friendRequestRepository.save(entity);

        FriendRequestResponse response = toRequestResponse(entity);
        realtimeNotifier.notifyUser(receiver.getId(), FriendRealtimeEventResponse.builder()
                .eventType("friend.request.created")
                .request(response)
                .build());
        log.info("Friend request created: senderId={} receiverId={} requestId={}", userId, receiver.getId(), entity.getId());
        return response;
    }

    @Override
    @Transactional
    public FriendRequestResponse acceptRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndReceiverId(requestId, userId)
                .orElseThrow(() -> AppException.notFound("Friend request not found"));
        ensurePending(request);

        Friendship friendship = createFriendship(request.getSender(), request.getReceiver());
        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        FriendRequestResponse response = toRequestResponse(request);
        realtimeNotifier.notifyUser(request.getSender().getId(), FriendRealtimeEventResponse.builder()
                .eventType("friend.request.accepted")
                .request(response)
                .friendship(toFriendshipResponse(request.getSender().getId(), friendship))
                .build());
        realtimeNotifier.notifyUser(request.getReceiver().getId(), FriendRealtimeEventResponse.builder()
                .eventType("friend.request.accepted")
                .request(response)
                .friendship(toFriendshipResponse(request.getReceiver().getId(), friendship))
                .build());
        return response;
    }

    @Override
    @Transactional
    public FriendRequestResponse rejectRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndReceiverId(requestId, userId)
                .orElseThrow(() -> AppException.notFound("Friend request not found"));
        ensurePending(request);
        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        FriendRequestResponse response = toRequestResponse(request);
        realtimeNotifier.notifyUser(request.getSender().getId(), FriendRealtimeEventResponse.builder()
                .eventType("friend.request.rejected")
                .request(response)
                .build());
        return response;
    }

    @Override
    @Transactional
    public FriendRequestResponse cancelRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findByIdAndSenderId(requestId, userId)
                .orElseThrow(() -> AppException.notFound("Friend request not found"));
        ensurePending(request);
        request.setStatus(FriendRequestStatus.CANCELED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        FriendRequestResponse response = toRequestResponse(request);
        realtimeNotifier.notifyUser(request.getReceiver().getId(), FriendRealtimeEventResponse.builder()
                .eventType("friend.request.canceled")
                .request(response)
                .build());
        return response;
    }

    @Override
    public Page<FriendRequestResponse> listIncomingRequests(Long userId, Pageable pageable) {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING, pageable)
                .map(this::toRequestResponse);
    }

    @Override
    public Page<FriendRequestResponse> listOutgoingRequests(Long userId, Pageable pageable) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequestStatus.PENDING, pageable)
                .map(this::toRequestResponse);
    }

    @Override
    public Page<FriendshipResponse> listFriends(Long userId, Pageable pageable) {
        return friendshipRepository.findAll(FriendshipSpecification.forUser(userId), pageable)
                .map(friendship -> toFriendshipResponse(userId, friendship));
    }

    @Override
    public Page<FriendSearchResponse> searchUsers(Long userId, String keyword, Pageable pageable) {
        if (!StringUtils.hasText(keyword)) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        return userRepository.findAll(UserSpecification.searchForFriend(userId, keyword.trim()), pageable)
                .map(user -> FriendSearchResponse.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .displayName(user.getDisplayName())
                        .avatarUrl(user.getAvatarUrl())
                        .avatarKey(user.getAvatarKey())
                        .relationStatus(resolveRelationStatus(userId, user.getId()))
                        .build());
    }

    private Friendship createFriendship(User userA, User userB) {
        Long firstId = Math.min(userA.getId(), userB.getId());
        Long secondId = Math.max(userA.getId(), userB.getId());
        Friendship existing = friendshipRepository.findByUserOneIdAndUserTwoId(firstId, secondId).orElse(null);
        if (existing != null) {
            return existing;
        }

        User first = userA.getId().equals(firstId) ? userA : userB;
        User second = userA.getId().equals(secondId) ? userA : userB;
        Friendship friendship = Friendship.builder()
                .userOne(first)
                .userTwo(second)
                .build();
        return friendshipRepository.save(friendship);
    }

    private void ensureNotFriends(Long userId, Long otherUserId) {
        if (friendshipRepository.findOne(FriendshipSpecification.betweenUsers(userId, otherUserId)).isPresent()) {
            throw AppException.conflict("These users are already friends");
        }
    }

    private void ensurePending(FriendRequest request) {
        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw AppException.conflict("Friend request is no longer pending");
        }
    }

    private FriendRelationStatus resolveRelationStatus(Long currentUserId, Long otherUserId) {
        if (friendshipRepository.findOne(FriendshipSpecification.betweenUsers(currentUserId, otherUserId)).isPresent()) {
            return FriendRelationStatus.FRIEND;
        }

        List<FriendRequest> pending = friendRequestRepository.findAll(
                FriendRequestSpecification.pendingBetweenUsers(currentUserId, otherUserId),
                Sort.by("createdAt").descending()
        );
        if (pending.isEmpty()) {
            return FriendRelationStatus.NONE;
        }

        FriendRequest latest = pending.stream()
                .max(Comparator.comparing(FriendRequest::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(pending.get(0));
        return latest.getSender().getId().equals(currentUserId)
                ? FriendRelationStatus.REQUEST_SENT
                : FriendRelationStatus.REQUEST_RECEIVED;
    }

    private FriendshipResponse toFriendshipResponse(Long currentUserId, Friendship friendship) {
        User otherUser = friendship.getUserOne().getId().equals(currentUserId)
                ? friendship.getUserTwo()
                : friendship.getUserOne();
        return FriendshipResponse.builder()
                .friendshipId(friendship.getId())
                .friend(toUserSummary(otherUser))
                .createdAt(friendship.getCreatedAt())
                .build();
    }

    private FriendRequestResponse toRequestResponse(FriendRequest request) {
        return FriendRequestResponse.builder()
                .id(request.getId())
                .sender(toUserSummary(request.getSender()))
                .receiver(toUserSummary(request.getReceiver()))
                .message(request.getRequestMessage())
                .status(request.getStatus())
                .respondedAt(request.getRespondedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    private FriendUserSummaryResponse toUserSummary(User user) {
        return FriendUserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .avatarKey(user.getAvatarKey())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
