package com.sba302.reminer.module.healing.service.impl;

import com.sba302.reminer.common.enums.HealingTrend;
import com.sba302.reminer.common.event.JournalSavedEvent;
import com.sba302.reminer.module.healing.entity.DailyEmotion;
import com.sba302.reminer.module.healing.entity.HealingProgress;
import com.sba302.reminer.module.healing.dto.response.HealingTimelineResponse;
import com.sba302.reminer.module.healing.dto.response.TimelineDataPoint;
import com.sba302.reminer.module.healing.dto.response.TimelineMilestone;
import com.sba302.reminer.module.healing.repository.DailyEmotionRepository;
import com.sba302.reminer.module.healing.repository.HealingProgressRepository;
import com.sba302.reminer.module.healing.service.HealingService;
import com.sba302.reminer.module.healing.service.SentimentService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
class HealingServiceImpl implements HealingService {

    private final DailyEmotionRepository dailyEmotionRepo;
    private final HealingProgressRepository progressRepo;
    private final UserRepository userRepository;
    private final SentimentService sentimentService;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleJournalSavedEvent(JournalSavedEvent event) {
        log.info("Handling JournalSavedEvent for user {} journal {}", event.getUserId(), event.getJournalEntryId());
        try {
            User user = userRepository.findById(event.getUserId()).orElseThrow();

            ZoneId zoneId = resolveZone(event.getTimezone());
            LocalDate recordDate = event.getEntryAt().atZone(zoneId).toLocalDate();

            Double moodScore = (double) event.getMoodCode().getScore();
            Double sentimentScore = (double) sentimentService.analyze(event.getContent());
            Double individualTotalScore = moodScore + sentimentScore; // range: 0 -> 6

            DailyEmotion dailyOpt = dailyEmotionRepo.findByUserIdAndRecordDate(user.getId(), recordDate)
                    .orElse(null);

            if (dailyOpt == null) {
                // Create new aggregated daily emotion
                DailyEmotion emotion = DailyEmotion.builder()
                        .user(user)
                        .recordDate(recordDate)
                        .entryCount(1)
                        .avgMoodScore(moodScore)
                        .avgSentimentScore(sentimentScore)
                        .totalScore(individualTotalScore)
                        .build();
                dailyEmotionRepo.save(emotion);
            } else {
                // Update average for multiple entries per day
                int newCount = dailyOpt.getEntryCount() + 1;
                double newAvgMood = ((dailyOpt.getAvgMoodScore() * dailyOpt.getEntryCount()) + moodScore) / newCount;
                double newAvgSentiment = ((dailyOpt.getAvgSentimentScore() * dailyOpt.getEntryCount()) + sentimentScore) / newCount;

                dailyOpt.setEntryCount(newCount);
                dailyOpt.setAvgMoodScore(newAvgMood);
                dailyOpt.setAvgSentimentScore(newAvgSentiment);
                dailyOpt.setTotalScore(newAvgMood + newAvgSentiment);
                dailyEmotionRepo.save(dailyOpt);
            }

            // Sync progress after capturing today's mood
            updateProgress(user.getId(), recordDate);
        } catch (Exception e) {
            log.error("Failed to process JournalSavedEvent for user {}: {}", event.getUserId(), e.getMessage());
        }
    }

    private void updateProgress(Long userId, LocalDate eventDate) {
        User user = userRepository.findById(userId).orElseThrow();
        HealingProgress progress = progressRepo.findByUserId(userId)
                .orElse(HealingProgress.builder().user(user).build());

        // Update last tracked date
        if (progress.getLastTrackedDate() == null || eventDate.isAfter(progress.getLastTrackedDate())) {
            progress.setLastTrackedDate(eventDate);
        }

        // Fetch last 5 records dynamically ordered by recordDate desc for average and trend
        List<DailyEmotion> last5Emotions = dailyEmotionRepo.findTop5ByUserIdOrderByRecordDateDesc(userId);
        if (last5Emotions.isEmpty()) return;

        // AvgScore
        double overallScore = last5Emotions.stream()
                .mapToDouble(DailyEmotion::getTotalScore)
                .average()
                .orElse(0.0);
        progress.setAvgScore(overallScore);

        // Trend calculation (Slope of last 5 days)
        if (last5Emotions.size() >= 2) {
            double slope = calculateSlope(last5Emotions);
            if (slope > 0.05) {
                progress.setTrend(HealingTrend.IMPROVING);
            } else if (slope < -0.05) {
                progress.setTrend(HealingTrend.DECLINING);
            } else {
                progress.setTrend(HealingTrend.STABLE);
            }
        } else {
            progress.setTrend(HealingTrend.STABLE);
        }

        // Streak logic
        int currentStreak = calculateStreak(userId, user.getTimezone());
        progress.setCurrentStreak(currentStreak);
        if (currentStreak > progress.getBestStreak()) {
            progress.setBestStreak(currentStreak);
        }

        progressRepo.save(progress);
    }

    private int calculateStreak(Long userId, String timezone) {
        ZoneId zoneId = resolveZone(timezone);
        LocalDate today = LocalDate.now(zoneId);

        // Fetch sufficient history to calculate current streak
        List<DailyEmotion> recent = dailyEmotionRepo.findTop30ByUserIdOrderByRecordDateDesc(userId);
        if (recent.isEmpty()) return 0;

        int streak = 0;
        int skipsAvailable = 1;
        LocalDate currentExpected = today;

        for (DailyEmotion em : recent) {
            long daysDiff = ChronoUnit.DAYS.between(em.getRecordDate(), currentExpected);

            if (daysDiff <= 0) {
                // Record is today or somehow future, count it
                streak++;
                currentExpected = em.getRecordDate().minusDays(1);
            } else if (daysDiff == 1) {
                // Normal consecutive day
                streak++;
                currentExpected = em.getRecordDate().minusDays(1);
            } else if (daysDiff == 2 && skipsAvailable > 0) {
                // User missed 1 day (gap = 1), use skip allowance
                streak++; // still count the record that we hit
                skipsAvailable--;
                currentExpected = em.getRecordDate().minusDays(1);
            } else {
                // Gap is 2 or more days, or skip allowance exhausted
                break;
            }
        }
        return streak;
    }

    private double calculateSlope(List<DailyEmotion> emotions) {
        int n = emotions.size();
        double sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        // emotions are sorted explicitly by Desc. We want chronological order for slope (x: 0..n-1) -> older = 0.
        for (int i = 0; i < n; i++) {
            double y = emotions.get(n - 1 - i).getTotalScore();
            double x = i;

            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        double denominator = (n * sumXX - sumX * sumX);
        if (denominator == 0) return 0.0;
        return (n * sumXY - sumX * sumY) / denominator;
    }

    @Override
    public HealingTimelineResponse getTimeline(Long userId, int days) {
        User user = userRepository.findById(userId).orElseThrow();
        ZoneId zoneId = resolveZone(user.getTimezone());
        LocalDate today = LocalDate.now(zoneId);
        LocalDate since = today.minusDays(days - 1);

        HealingProgress progress = progressRepo.findByUserId(userId).orElse(new HealingProgress());

        List<DailyEmotion> emotions = dailyEmotionRepo.findByUserIdAndRecordDateBetweenOrderByRecordDateAsc(userId, since, today);

        List<TimelineDataPoint> timeline = emotions.stream()
                .map(this::toDataPoint)
                .toList();

        List<Integer> milestoneGoals = List.of(1, 3, 7, 14, 30, 60, 90);
        int currentStreak = progress.getCurrentStreak() == null ? 0 : progress.getCurrentStreak();

        List<TimelineMilestone> milestones = milestoneGoals.stream()
                .map(m -> TimelineMilestone.builder()
                        .day(m)
                        .achieved(currentStreak >= m)
                        .build())
                .toList();

        return HealingTimelineResponse.builder()
                .streak(currentStreak)
                .trend(progress.getTrend() != null ? progress.getTrend() : HealingTrend.STABLE)
                .avgScore(progress.getAvgScore() == null ? 0.0 : progress.getAvgScore())
                .timeline(timeline)
                .milestones(milestones)
                .build();
    }

    private TimelineDataPoint toDataPoint(DailyEmotion e) {
        double score = e.getTotalScore();
        String moodLabel;
        String message;

        if (score >= 5.0) {
            moodLabel = "awesome";
            message = "Bạn đã có một ngày tuyệt vời!";
        } else if (score >= 4.0) {
            moodLabel = "good";
            message = "Mọi thứ diễn ra khá tốt đẹp.";
        } else if (score >= 3.0) {
            moodLabel = "okay";
            message = "Một ngày bình thường trôi qua.";
        } else if (score >= 2.0) {
            moodLabel = "bad";
            message = "Ngày hôm đó hơi mệt mỏi với bạn.";
        } else {
            moodLabel = "terrible";
            message = "Bạn đã trải qua một ngày rất khó khăn. Nhớ dành thời gian nghỉ ngơi nhé!";
        }

        return TimelineDataPoint.builder()
                .date(e.getRecordDate())
                .score(score)
                .moodLabel(moodLabel)
                .message(message)
                .build();
    }

    private ZoneId resolveZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }
}
