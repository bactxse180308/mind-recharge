package com.sba302.reminer.module.healing.repository;

import com.sba302.reminer.module.healing.entity.HealingProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealingProgressRepository extends JpaRepository<HealingProgress, Long> {
    Optional<HealingProgress> findByUserId(Long userId);
}
