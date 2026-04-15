package com.sba302.reminer.module.dailytask.repository;

import com.sba302.reminer.module.dailytask.entity.DailyTaskLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyTaskLogRepository
        extends JpaRepository<DailyTaskLog, Long>,
                JpaSpecificationExecutor<DailyTaskLog> {

    @EntityGraph(attributePaths = "taskTemplate")
    List<DailyTaskLog> findByUserIdAndTaskDate(Long userId, LocalDate taskDate);

    long countByUserIdAndTaskDateAndIsDoneTrue(Long userId, LocalDate taskDate);

    Optional<DailyTaskLog> findByUserIdAndTaskTemplateIdAndTaskDate(
            Long userId, Long templateId, LocalDate taskDate);
}
