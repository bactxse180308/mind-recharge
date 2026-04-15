package com.sba302.reminer.module.dailytask.repository;

import com.sba302.reminer.module.dailytask.entity.DailyTaskLog;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Specifications for DailyTaskLog — thay thế @Query BETWEEN.
 */
public class DailyTaskLogSpecification {

    private DailyTaskLogSpecification() {}

    public static Specification<DailyTaskLog> forUser(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<DailyTaskLog> dateRange(LocalDate from, LocalDate to) {
        return (root, query, cb) -> cb.between(root.get("taskDate"), from, to);
    }

    public static Specification<DailyTaskLog> forUserInRange(Long userId, LocalDate from, LocalDate to) {
        return Specification.where(forUser(userId)).and(dateRange(from, to));
    }
}
