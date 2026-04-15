package com.sba302.reminer.module.friend.repository;

import com.sba302.reminer.common.enums.FriendRequestStatus;
import com.sba302.reminer.module.friend.entity.FriendRequest;
import org.springframework.data.jpa.domain.Specification;

public class FriendRequestSpecification {

    private FriendRequestSpecification() {
    }

    public static Specification<FriendRequest> pendingBetweenUsers(Long userA, Long userB) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), FriendRequestStatus.PENDING),
                cb.or(
                        cb.and(
                                cb.equal(root.get("sender").get("id"), userA),
                                cb.equal(root.get("receiver").get("id"), userB)
                        ),
                        cb.and(
                                cb.equal(root.get("sender").get("id"), userB),
                                cb.equal(root.get("receiver").get("id"), userA)
                        )
                )
        );
    }
}
