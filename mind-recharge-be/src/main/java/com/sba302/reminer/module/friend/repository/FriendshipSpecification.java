package com.sba302.reminer.module.friend.repository;

import com.sba302.reminer.module.friend.entity.Friendship;
import org.springframework.data.jpa.domain.Specification;

public class FriendshipSpecification {

    private FriendshipSpecification() {
    }

    public static Specification<Friendship> forUser(Long userId) {
        return (root, query, cb) -> cb.or(
                cb.equal(root.get("userOne").get("id"), userId),
                cb.equal(root.get("userTwo").get("id"), userId)
        );
    }

    public static Specification<Friendship> betweenUsers(Long userA, Long userB) {
        return (root, query, cb) -> cb.or(
                cb.and(
                        cb.equal(root.get("userOne").get("id"), userA),
                        cb.equal(root.get("userTwo").get("id"), userB)
                ),
                cb.and(
                        cb.equal(root.get("userOne").get("id"), userB),
                        cb.equal(root.get("userTwo").get("id"), userA)
                )
        );
    }
}
