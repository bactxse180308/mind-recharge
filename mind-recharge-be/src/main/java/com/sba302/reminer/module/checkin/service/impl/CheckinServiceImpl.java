package com.sba302.reminer.module.checkin.service.impl;

import com.sba302.reminer.common.enums.ContentType;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.checkin.dto.request.CheckinRequest;
import com.sba302.reminer.module.checkin.dto.response.CheckinResponse;
import com.sba302.reminer.module.checkin.entity.DailyCheckin;
import com.sba302.reminer.module.checkin.repository.DailyCheckinRepository;
import com.sba302.reminer.module.checkin.repository.DailyCheckinSpecification;
import com.sba302.reminer.module.checkin.service.CheckinService;
import com.sba302.reminer.module.content.repository.ContentItemRepository;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CheckinServiceImpl implements CheckinService {

    private final DailyCheckinRepository checkinRepo;
    private final UserRepository userRepository;
    private final ContentItemRepository contentItemRepo;

    private static final String[] RESPONSE_KEYS_BAD     = {"BAD_1", "BAD_2"};
    private static final String[] RESPONSE_KEYS_NEUTRAL  = {"NEUTRAL_1", "NEUTRAL_2"};
    private static final String[] RESPONSE_KEYS_BETTER   = {"BETTER_1", "BETTER_2"};

    @Override
    @Transactional
    public CheckinResponse upsertToday(Long userId, CheckinRequest request) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now(resolveZone(user.getTimezone()));
        String responseKey = pickResponseKey(request.getMoodLevel());

        Optional<DailyCheckin> existing = checkinRepo.findByUserIdAndCheckinDate(userId, today);

        DailyCheckin checkin = existing.orElseGet(() -> DailyCheckin.builder()
                .user(user)
                .checkinDate(today)
                .build());

        checkin.setMoodLevel(request.getMoodLevel());
        checkin.setResponseKey(responseKey);
        checkin.setNote(request.getNote());
        checkinRepo.save(checkin);

        log.info("Checkin upserted: userId={} date={} mood={}", userId, today, request.getMoodLevel());
        return toResponse(checkin);
    }

    @Override
    public CheckinResponse getToday(Long userId) {
        User user = findUser(userId);
        LocalDate today = LocalDate.now(resolveZone(user.getTimezone()));
        return checkinRepo.findByUserIdAndCheckinDate(userId, today)
                .map(this::toResponse)
                .orElseThrow(() -> AppException.notFound("No check-in for today yet"));
    }

    @Override
    public List<CheckinResponse> getHistory(Long userId, LocalDate from, LocalDate to) {
        return checkinRepo.findAll(
                DailyCheckinSpecification.forUserInRange(userId, from, to),
                Sort.by("checkinDate").descending()
        ).stream().map(this::toResponse).toList();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private String pickResponseKey(com.sba302.reminer.common.enums.MoodLevel mood) {
        String[] keys = switch (mood) {
            case BAD     -> RESPONSE_KEYS_BAD;
            case NEUTRAL -> RESPONSE_KEYS_NEUTRAL;
            case BETTER  -> RESPONSE_KEYS_BETTER;
        };
        int idx = (int) (System.currentTimeMillis() / 1000) % keys.length;
        return keys[idx];
    }

    private CheckinResponse toResponse(DailyCheckin c) {
        String responseText = contentItemRepo
                .findByContentTypeAndContentKey(ContentType.MOOD_RESPONSE, c.getResponseKey())
                .map(ci -> ci.getText())
                .orElse(null);

        return CheckinResponse.builder()
                .id(c.getId())
                .checkinDate(c.getCheckinDate())
                .moodLevel(c.getMoodLevel())
                .responseKey(c.getResponseKey())
                .responseText(responseText)
                .note(c.getNote())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private ZoneId resolveZone(String timezone) {
        try { return ZoneId.of(timezone); } catch (Exception e) { return ZoneId.of("UTC"); }
    }
}
