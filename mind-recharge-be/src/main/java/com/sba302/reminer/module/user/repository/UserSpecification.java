package com.sba302.reminer.module.user.repository;

import com.sba302.reminer.module.user.entity.User;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

    private UserSpecification() {
    }

    public static Specification<User> searchForFriend(Long currentUserId, String keyword) {
        String pattern = "%" + keyword.toLowerCase() + "%";
        return (root, query, cb) -> cb.and(
                cb.notEqual(root.get("id"), currentUserId),
                cb.or(
                        cb.like(cb.lower(root.get("displayName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern)
                )
        );
    }
}
