package com.sba302.reminer.module.unsent.repository;

import com.sba302.reminer.module.unsent.entity.UnsentMessage;
import org.springframework.data.jpa.domain.Specification;

/**
 * Specifications for UnsentMessage — thay thế toàn bộ @Query.
 */
public class UnsentMessageSpecification {

    private UnsentMessageSpecification() {}

    public static Specification<UnsentMessage> forUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<UnsentMessage> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<UnsentMessage> withStatus(
            com.sba302.reminer.common.enums.UnsentMessageStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<UnsentMessage> withId(Long id) {
        return (root, query, cb) -> cb.equal(root.get("id"), id);
    }

    public static Specification<UnsentMessage> activeForUser(Long userId,
            com.sba302.reminer.common.enums.UnsentMessageStatus status) {
        return Specification.where(forUser(userId))
                .and(withStatus(status))
                .and(notDeleted());
    }

    public static Specification<UnsentMessage> activeByIdForUser(Long id, Long userId) {
        return Specification.where(withId(id))
                .and(forUser(userId))
                .and(notDeleted());
    }
}
