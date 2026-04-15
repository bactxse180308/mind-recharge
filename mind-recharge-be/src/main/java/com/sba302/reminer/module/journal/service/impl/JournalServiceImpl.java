package com.sba302.reminer.module.journal.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.journal.dto.request.CreateJournalRequest;
import com.sba302.reminer.module.journal.dto.request.UpdateJournalRequest;
import com.sba302.reminer.module.journal.dto.response.JournalResponse;
import com.sba302.reminer.module.journal.entity.JournalEntry;
import com.sba302.reminer.module.journal.repository.JournalEntryRepository;
import com.sba302.reminer.module.journal.repository.JournalEntrySpecification;
import com.sba302.reminer.module.journal.service.JournalService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class JournalServiceImpl implements JournalService {

    private final JournalEntryRepository journalRepo;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public JournalResponse create(Long userId, CreateJournalRequest request) {
        User user = findUser(userId);
        Instant entryAt = request.getEntryAt() != null ? request.getEntryAt() : Instant.now();

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .moodCode(request.getMoodCode())
                .content(request.getContent())
                .entryAt(entryAt)
                .build();

        journalRepo.save(entry);
        
        eventPublisher.publishEvent(com.sba302.reminer.common.event.JournalSavedEvent.builder()
                .journalEntryId(entry.getId())
                .userId(user.getId())
                .timezone(user.getTimezone())
                .moodCode(entry.getMoodCode())
                .content(entry.getContent())
                .entryAt(entry.getEntryAt())
                .build());

        log.info("Journal created: id={} userId={}", entry.getId(), userId);
        return toResponse(entry);
    }

    @Override
    public Page<JournalResponse> list(Long userId, Pageable pageable) {
        return journalRepo.findAll(
                JournalEntrySpecification.activeForUser(userId), pageable
        ).map(this::toResponse);
    }

    @Override
    public JournalResponse getById(Long userId, Long id) {
        return journalRepo.findAll(
                JournalEntrySpecification.activeForUser(userId)
                        .and((root, q, cb) -> cb.equal(root.get("id"), id))
        ).stream().findFirst().map(this::toResponse)
                .orElseThrow(() -> AppException.notFound("Journal entry not found"));
    }

    @Override
    @Transactional
    public JournalResponse update(Long userId, Long id, UpdateJournalRequest request) {
        JournalEntry entry = journalRepo.findAll(
                JournalEntrySpecification.activeForUser(userId)
                        .and((root, q, cb) -> cb.equal(root.get("id"), id))
        ).stream().findFirst()
                .orElseThrow(() -> AppException.notFound("Journal entry not found"));

        if (request.getMoodCode() != null) entry.setMoodCode(request.getMoodCode());
        if (StringUtils.hasText(request.getContent())) entry.setContent(request.getContent());

        journalRepo.save(entry);
        
        eventPublisher.publishEvent(com.sba302.reminer.common.event.JournalSavedEvent.builder()
                .journalEntryId(entry.getId())
                .userId(userId)
                .timezone(entry.getUser().getTimezone())
                .moodCode(entry.getMoodCode())
                .content(entry.getContent())
                .entryAt(entry.getEntryAt())
                .build());

        log.info("Journal updated: id={} userId={}", id, userId);
        return toResponse(entry);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        JournalEntry entry = journalRepo.findAll(
                JournalEntrySpecification.activeForUser(userId)
                        .and((root, q, cb) -> cb.equal(root.get("id"), id))
        ).stream().findFirst()
                .orElseThrow(() -> AppException.notFound("Journal entry not found"));

        entry.setDeletedAt(Instant.now());
        journalRepo.save(entry);
        log.info("Journal soft-deleted: id={} userId={}", id, userId);
    }

    @Override
    public List<JournalResponse> getHighlight(Long userId) {
        User user = findUser(userId);
        ZoneId zoneId = resolveZone(user.getTimezone());

        ZonedDateTime nowLocal = ZonedDateTime.now(zoneId);
        Instant from = nowLocal.minusDays(4).toLocalDate().atStartOfDay(zoneId).toInstant();
        Instant to   = nowLocal.minusDays(2).toLocalDate().atStartOfDay(zoneId).plusDays(1).toInstant();

        return journalRepo.findAll(
                JournalEntrySpecification.activeForUserInRange(userId, from, to),
                Sort.by("entryAt").descending()
        ).stream().map(this::toResponse).toList();
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private ZoneId resolveZone(String timezone) {
        try { return ZoneId.of(timezone); } catch (Exception e) { return ZoneId.of("UTC"); }
    }

    private JournalResponse toResponse(JournalEntry e) {
        return JournalResponse.builder()
                .id(e.getId())
                .moodCode(e.getMoodCode())
                .content(e.getContent())
                .entryAt(e.getEntryAt())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
