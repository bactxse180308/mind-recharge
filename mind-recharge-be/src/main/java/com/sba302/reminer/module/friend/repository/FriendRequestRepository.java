package com.sba302.reminer.module.friend.repository;

import com.sba302.reminer.common.enums.FriendRequestStatus;
import com.sba302.reminer.module.friend.entity.FriendRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long>,
        JpaSpecificationExecutor<FriendRequest> {

    Page<FriendRequest> findByReceiverIdAndStatus(Long receiverId, FriendRequestStatus status, Pageable pageable);

    Page<FriendRequest> findBySenderIdAndStatus(Long senderId, FriendRequestStatus status, Pageable pageable);

    Optional<FriendRequest> findByIdAndReceiverId(Long id, Long receiverId);

    Optional<FriendRequest> findByIdAndSenderId(Long id, Long senderId);
}
