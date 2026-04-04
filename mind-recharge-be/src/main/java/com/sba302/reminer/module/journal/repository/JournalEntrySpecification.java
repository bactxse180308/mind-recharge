package com.sba302.reminer.module.journal.repository;

import com.sba302.reminer.module.journal.entity.JournalEntry;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Specifications for JournalEntry — replaces all custom @Query.
 * Use via JpaSpecificationExecutor methods in the repository.
 */
public class JournalEntrySpecification {

    private JournalEntrySpecification() {}

    /** Filter: only non-deleted entries (deletedAt IS NULL) */
    public static Specification<JournalEntry> notDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    /** Filter: belongs to specific user */
    public static Specification<JournalEntry> forUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    /** Filter: entryAt within a range (for highlight feature: 2–4 days ago) */
    public static Specification<JournalEntry> entryAtBetween(Instant from, Instant to) {
        return (root, query, cb) -> cb.between(root.get("entryAt"), from, to);
    }

    /** Composite: active entries for a user (not deleted) */
    public static Specification<JournalEntry> activeForUser(Long userId) {
        return Specification.where(forUser(userId)).and(notDeleted());
    }

    /** Composite: active entries for a user within a time range */
    public static Specification<JournalEntry> activeForUserInRange(Long userId, Instant from, Instant to) {
        return Specification.where(forUser(userId))
                .and(notDeleted())
                .and(entryAtBetween(from, to));
    }
}
