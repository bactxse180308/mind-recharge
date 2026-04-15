package com.sba302.reminer.module.checkin.repository;

import com.sba302.reminer.module.checkin.entity.DailyCheckin;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Specifications for DailyCheckin — thay thế @Query BETWEEN.
 */
public class DailyCheckinSpecification {

    private DailyCheckinSpecification() {}

    public static Specification<DailyCheckin> forUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<DailyCheckin> dateRange(LocalDate from, LocalDate to) {
        return (root, query, cb) -> cb.between(root.get("checkinDate"), from, to);
    }

    public static Specification<DailyCheckin> forUserInRange(Long userId, LocalDate from, LocalDate to) {
        return Specification.where(forUser(userId)).and(dateRange(from, to));
    }
}
