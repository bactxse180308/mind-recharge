package com.sba302.reminer.module.healing.repository;

import com.sba302.reminer.module.healing.entity.DailyEmotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyEmotionRepository extends JpaRepository<DailyEmotion, Long> {

    Optional<DailyEmotion> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    List<DailyEmotion> findTop5ByUserIdOrderByRecordDateDesc(Long userId);
    
    List<DailyEmotion> findTop30ByUserIdOrderByRecordDateDesc(Long userId);

    List<DailyEmotion> findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(Long userId, LocalDate from, LocalDate to);
}
