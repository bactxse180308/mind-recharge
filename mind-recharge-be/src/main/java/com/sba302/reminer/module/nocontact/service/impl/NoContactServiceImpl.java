package com.sba302.reminer.module.nocontact.service.impl;

import com.sba302.reminer.common.enums.JourneyStatus;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.nocontact.dto.request.ResetJourneyRequest;
import com.sba302.reminer.module.nocontact.dto.response.NoContactJourneyResponse;
import com.sba302.reminer.module.nocontact.entity.NoContactJourney;
import com.sba302.reminer.module.nocontact.entity.NoContactMilestoneEvent;
import com.sba302.reminer.module.nocontact.repository.NoContactJourneyRepository;
import com.sba302.reminer.module.nocontact.repository.NoContactMilestoneEventRepository;
import com.sba302.reminer.module.nocontact.service.NoContactService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class NoContactServiceImpl implements NoContactService {

    private static final int[] MILESTONE_DAYS = {1, 3, 7, 14, 30, 60, 90};

    private final NoContactJourneyRepository journeyRepo;
    private final NoContactMilestoneEventRepository milestoneRepo;
    private final UserRepository userRepository;

    @Override
    public NoContactJourneyResponse getCurrent(Long userId) {
        User user = findUser(userId);
        NoContactJourney journey = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .orElseThrow(() -> AppException.notFound("No active no-contact journey"));
        return toResponse(journey, user.getTimezone());
    }

    @Override
    @Transactional
    public NoContactJourneyResponse start(Long userId) {
        if (journeyRepo.existsByUserIdAndStatus(userId, JourneyStatus.ACTIVE)) {
            throw AppException.conflict("You already have an active no-contact journey");
        }
        User user = findUser(userId);
        NoContactJourney journey = NoContactJourney.builder()
                .user(user)
                .startedAt(Instant.now())
                .build();
        journeyRepo.save(journey);
        log.info("No-contact journey started: id={} userId={}", journey.getId(), userId);
        return toResponse(journey, user.getTimezone());
    }

    @Override
    @Transactional
    public NoContactJourneyResponse reset(Long userId, ResetJourneyRequest request) {
        User user = findUser(userId);
        NoContactJourney active = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .orElseThrow(() -> AppException.notFound("No active journey to reset"));

        active.setStatus(JourneyStatus.RESET);
        active.setEndedAt(Instant.now());
        active.setResetReason(request.getResetReason());
        journeyRepo.save(active);
        log.info("No-contact journey reset: id={} userId={}", active.getId(), userId);
        return toResponse(active, user.getTimezone());
    }

    @Override
    public Page<NoContactJourneyResponse> history(Long userId, Pageable pageable) {
        User user = findUser(userId);
        return journeyRepo.findAllByUserId(userId, pageable)
                .map(j -> toResponse(j, user.getTimezone()));
    }

    // ── Milestone check — called internally (e.g. from scheduled task or lazy on getCurrent) ──

    @Transactional
    public void recordMilestonesIfDue(Long journeyId, long streakDays) {
        for (int day : MILESTONE_DAYS) {
            if (streakDays >= day && !milestoneRepo.existsByJourneyIdAndMilestoneDay(journeyId, day)) {
                milestoneRepo.save(NoContactMilestoneEvent.builder()
                        .journey(NoContactJourney.builder().id(journeyId).build())
                        .milestoneDay(day)
                        .build());
                log.info("Milestone recorded: journeyId={} day={}", journeyId, day);
            }
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private long computeStreakDays(Instant startedAt, String timezone) {
        ZoneId zoneId;
        try { zoneId = ZoneId.of(timezone); } catch (Exception e) { zoneId = ZoneId.of("UTC"); }

        ZonedDateTime start = startedAt.atZone(zoneId).toLocalDate().atStartOfDay(zoneId);
        ZonedDateTime now   = ZonedDateTime.now(zoneId).toLocalDate().atStartOfDay(zoneId);
        return java.time.Duration.between(start, now).toDays();
    }

    private NoContactJourneyResponse toResponse(NoContactJourney j, String timezone) {
        long streak = j.isActive() ? computeStreakDays(j.getStartedAt(), timezone) : 0;
        List<Integer> milestones = milestoneRepo.findByJourneyIdOrderByMilestoneDayAsc(j.getId())
                .stream().map(NoContactMilestoneEvent::getMilestoneDay).toList();

        // Idempotent milestone recording for active journeys
        if (j.isActive()) {
            recordMilestonesIfDue(j.getId(), streak);
        }

        return NoContactJourneyResponse.builder()
                .id(j.getId())
                .status(j.getStatus())
                .startedAt(j.getStartedAt())
                .endedAt(j.getEndedAt())
                .resetReason(j.getResetReason())
                .streakDays(streak)
                .achievedMilestones(milestones)
                .createdAt(j.getCreatedAt())
                .updatedAt(j.getUpdatedAt())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
