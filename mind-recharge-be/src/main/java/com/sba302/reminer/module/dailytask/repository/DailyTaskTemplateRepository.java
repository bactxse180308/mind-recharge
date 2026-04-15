package com.sba302.reminer.module.dailytask.repository;

import com.sba302.reminer.module.dailytask.entity.DailyTaskTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DailyTaskTemplateRepository extends JpaRepository<DailyTaskTemplate, Long> {

    List<DailyTaskTemplate> findByIsActiveTrueOrderBySortOrderAsc();

    long countByIsActiveTrue();

    Optional<DailyTaskTemplate> findByCode(String code);
}
