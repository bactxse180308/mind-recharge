package com.sba302.reminer.module.trigger.service.impl;

import com.sba302.reminer.common.enums.TriggerSessionStatus;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.trigger.dto.response.TriggerSessionResponse;
import com.sba302.reminer.module.trigger.entity.EmotionalTriggerSession;
import com.sba302.reminer.module.trigger.repository.EmotionalTriggerSessionRepository;
import com.sba302.reminer.module.trigger.service.TriggerSessionService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class TriggerSessionServiceImpl implements TriggerSessionService {

    private final EmotionalTriggerSessionRepository sessionRepo;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TriggerSessionResponse start(Long userId) {
        User user = findUser(userId);
        EmotionalTriggerSession session = EmotionalTriggerSession.builder()
                .user(user)
                .build();
        sessionRepo.save(session);
        log.info("Trigger session started: id={} userId={}", session.getId(), userId);
        return toResponse(session);
    }

    @Override
    @Transactional
    public TriggerSessionResponse complete(Long userId, Long sessionId) {
        return terminate(userId, sessionId, TriggerSessionStatus.COMPLETED);
    }

    @Override
    @Transactional
    public TriggerSessionResponse cancel(Long userId, Long sessionId) {
        return terminate(userId, sessionId, TriggerSessionStatus.CANCELLED);
    }

    @Override
    @Transactional
    public TriggerSessionResponse redirectToUnsent(Long userId, Long sessionId) {
        return terminate(userId, sessionId, TriggerSessionStatus.REDIRECTED_TO_UNSENT);
    }

    private TriggerSessionResponse terminate(Long userId, Long sessionId, TriggerSessionStatus status) {
        // Uses derived method findByIdAndUserId — no @Query
        EmotionalTriggerSession session = sessionRepo.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> AppException.notFound("Trigger session not found"));

        if (!session.isRunning()) {
            throw AppException.badRequest("Session is already in terminal state: " + session.getStatus());
        }
        session.setStatus(status);
        session.setEndedAt(Instant.now());
        sessionRepo.save(session);
        log.info("Trigger session [{}]: id={} userId={}", status, sessionId, userId);
        return toResponse(session);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private TriggerSessionResponse toResponse(EmotionalTriggerSession s) {
        return TriggerSessionResponse.builder()
                .id(s.getId())
                .status(s.getStatus())
                .durationSeconds(s.getDurationSeconds())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
