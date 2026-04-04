package com.sba302.reminer.module.trigger.repository;

import com.sba302.reminer.common.enums.TriggerSessionStatus;
import com.sba302.reminer.module.trigger.entity.EmotionalTriggerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmotionalTriggerSessionRepository
        extends JpaRepository<EmotionalTriggerSession, Long>,
                JpaSpecificationExecutor<EmotionalTriggerSession> {

    /** Derived query method — replaces @Query WHERE id AND userId */
    Optional<EmotionalTriggerSession> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndStatus(Long userId, TriggerSessionStatus status);
}
