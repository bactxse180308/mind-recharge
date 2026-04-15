package com.sba302.reminer.module.checkin.repository;

import com.sba302.reminer.module.checkin.entity.DailyCheckin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyCheckinRepository
        extends JpaRepository<DailyCheckin, Long>,
                JpaSpecificationExecutor<DailyCheckin> {

    boolean existsByUserIdAndCheckinDate(Long userId, LocalDate date);

    Optional<DailyCheckin> findByUserIdAndCheckinDate(Long userId, LocalDate date);
}
