package com.sba302.reminer.module.nocontact.repository;

import com.sba302.reminer.common.enums.JourneyStatus;
import com.sba302.reminer.module.nocontact.entity.NoContactJourney;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NoContactJourneyRepository
        extends JpaRepository<NoContactJourney, Long>,
                JpaSpecificationExecutor<NoContactJourney> {

    Optional<NoContactJourney> findByUserIdAndStatus(Long userId, JourneyStatus status);

    boolean existsByUserIdAndStatus(Long userId, JourneyStatus status);

    /** Simple derived method — ORDER BY handled by Pageable sort parameter */
    Page<NoContactJourney> findAllByUserId(Long userId, Pageable pageable);
}
