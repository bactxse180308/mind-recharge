package com.sba302.reminer.module.nocontact.repository;

import com.sba302.reminer.module.nocontact.entity.JourneyDailyLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface JourneyDailyLogRepository extends JpaRepository<JourneyDailyLog, Long> {

    Optional<JourneyDailyLog> findByJourneyIdAndLogDate(Long journeyId, LocalDate logDate);

    Page<JourneyDailyLog> findAllByJourneyIdOrderByLogDateDesc(Long journeyId, Pageable pageable);
}
