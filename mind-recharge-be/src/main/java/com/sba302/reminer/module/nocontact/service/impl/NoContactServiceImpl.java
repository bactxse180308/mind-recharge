package com.sba302.reminer.module.nocontact.service.impl;

import com.sba302.reminer.common.enums.JourneyStatus;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.nocontact.dto.request.CreateDailyLogRequest;
import com.sba302.reminer.module.nocontact.dto.request.ResetJourneyRequest;
import com.sba302.reminer.module.nocontact.dto.response.DailyLogResponse;
import com.sba302.reminer.module.nocontact.dto.response.NoContactJourneyResponse;
import com.sba302.reminer.module.nocontact.dto.response.NoContactStatsResponse;
import com.sba302.reminer.module.nocontact.entity.JourneyDailyLog;
import com.sba302.reminer.module.nocontact.entity.NoContactJourney;
import com.sba302.reminer.module.nocontact.entity.NoContactMilestoneEvent;
import com.sba302.reminer.module.nocontact.repository.JourneyDailyLogRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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
    private final JourneyDailyLogRepository dailyLogRepo;
    private final UserRepository userRepository;

    @Override
    @Transactional
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
    @Transactional
    public Page<NoContactJourneyResponse> history(Long userId, Pageable pageable) {
        User user = findUser(userId);
        return journeyRepo.findAllByUserId(userId, pageable)
                .map(j -> toResponse(j, user.getTimezone()));
    }

    @Override
    public NoContactStatsResponse getStats(Long userId) {
        User user = findUser(userId);
        List<NoContactJourney> all = journeyRepo.findAllByUserId(userId);
        long longestStreak = 0;
        int totalResets = 0;
        for (NoContactJourney j : all) {
            if (j.getStatus() == JourneyStatus.RESET) {
                totalResets++;
                if (j.getEndedAt() != null) {
                    long days = computeJourneyDays(j.getStartedAt(), j.getEndedAt(), user.getTimezone());
                    if (days > longestStreak) longestStreak = days;
                }
            } else if (j.isActive()) {
                long days = computeStreakDays(j.getStartedAt(), user.getTimezone());
                if (days > longestStreak) longestStreak = days;
            }
        }
        return NoContactStatsResponse.builder()
                .longestStreakDays(longestStreak)
                .totalResets(totalResets)
                .build();
    }

    @Override
    @Transactional
    public DailyLogResponse upsertDailyLog(Long userId, CreateDailyLogRequest request) {
        User user = findUser(userId);
        NoContactJourney journey = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .orElseThrow(() -> AppException.notFound("No active no-contact journey"));

        ZoneId zoneId = resolveZone(user.getTimezone());
        LocalDate today = LocalDate.now(zoneId);

        JourneyDailyLog logEntry = dailyLogRepo.findByJourneyIdAndLogDate(journey.getId(), today)
                .orElseGet(() -> JourneyDailyLog.builder()
                        .journey(journey)
                        .user(user)
                        .logDate(today)
                        .build());
        logEntry.setContent(request.getContent());
        return toDailyLogResponse(dailyLogRepo.save(logEntry));
    }

    @Override
    public Page<DailyLogResponse> getDailyLogs(Long userId, Pageable pageable) {
        NoContactJourney journey = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .orElseThrow(() -> AppException.notFound("No active no-contact journey"));
        return dailyLogRepo.findAllByJourneyIdOrderByLogDateDesc(journey.getId(), pageable)
                .map(this::toDailyLogResponse);
    }

    // ── Milestone check ────────────────────────────────────────────────────────

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
        ZoneId zoneId = resolveZone(timezone);
        ZonedDateTime start = startedAt.atZone(zoneId).toLocalDate().atStartOfDay(zoneId);
        ZonedDateTime now   = ZonedDateTime.now(zoneId).toLocalDate().atStartOfDay(zoneId);
        return Duration.between(start, now).toDays();
    }

    private long computeJourneyDays(Instant startedAt, Instant endedAt, String timezone) {
        ZoneId zoneId = resolveZone(timezone);
        ZonedDateTime start = startedAt.atZone(zoneId).toLocalDate().atStartOfDay(zoneId);
        ZonedDateTime end   = endedAt.atZone(zoneId).toLocalDate().atStartOfDay(zoneId);
        return Duration.between(start, end).toDays();
    }

    private ZoneId resolveZone(String timezone) {
        try { return ZoneId.of(timezone); } catch (Exception e) { return ZoneId.of("UTC"); }
    }

    private NoContactJourneyResponse toResponse(NoContactJourney j, String timezone) {
        long streak = j.isActive() ? computeStreakDays(j.getStartedAt(), timezone) : 0;

        if (j.isActive()) {
            recordMilestonesIfDue(j.getId(), streak);
        }

        List<Integer> milestones = milestoneRepo.findByJourneyIdOrderByMilestoneDayAsc(j.getId())
                .stream().map(NoContactMilestoneEvent::getMilestoneDay).toList();

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

    private DailyLogResponse toDailyLogResponse(JourneyDailyLog log) {
        return DailyLogResponse.builder()
                .id(log.getId())
                .logDate(log.getLogDate())
                .content(log.getContent())
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
