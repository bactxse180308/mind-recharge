package com.sba302.reminer.module.nocontact.repository;

import com.sba302.reminer.module.nocontact.entity.NoContactMilestoneEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoContactMilestoneEventRepository extends JpaRepository<NoContactMilestoneEvent, Long> {

    List<NoContactMilestoneEvent> findByJourneyIdOrderByMilestoneDayAsc(Long journeyId);

    boolean existsByJourneyIdAndMilestoneDay(Long journeyId, Integer milestoneDay);
}
