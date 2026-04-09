package com.sba302.reminer.module.unsent.service.impl;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.unsent.dto.request.CreateUnsentMessageRequest;
import com.sba302.reminer.module.unsent.dto.response.UnsentMessageResponse;
import com.sba302.reminer.module.unsent.entity.UnsentMessage;
import com.sba302.reminer.module.unsent.repository.UnsentMessageRepository;
import com.sba302.reminer.module.unsent.repository.UnsentMessageSpecification;
import com.sba302.reminer.module.unsent.service.UnsentMessageService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class UnsentMessageServiceImpl implements UnsentMessageService {

    private final UnsentMessageRepository unsentRepo;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public UnsentMessageResponse create(Long userId, CreateUnsentMessageRequest request) {
        User user = findUser(userId);
        UnsentMessage msg = UnsentMessage.builder()
                .user(user)
                .content(request.getContent())
                .build();
        unsentRepo.save(msg);
        log.info("Unsent message created: id={} userId={}", msg.getId(), userId);
        return toResponse(msg);
    }

    @Override
    public Page<UnsentMessageResponse> list(Long userId, UnsentMessageStatus status, Pageable pageable) {
        UnsentMessageStatus filter = status != null ? status : UnsentMessageStatus.ACTIVE;
        return unsentRepo.findAll(
                UnsentMessageSpecification.activeForUser(userId, filter), pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional
    public UnsentMessageResponse release(Long userId, Long id) {
        UnsentMessage msg = findActive(userId, id);
        if (msg.getStatus() != UnsentMessageStatus.ACTIVE) {
            throw AppException.badRequest("Message is not in ACTIVE state");
        }
        msg.setStatus(UnsentMessageStatus.RELEASED);
        msg.setReleasedAt(Instant.now());
        unsentRepo.save(msg);
        log.info("Unsent message released: id={} userId={}", id, userId);
        return toResponse(msg);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        UnsentMessage msg = findActive(userId, id);
        msg.setStatus(UnsentMessageStatus.DELETED);
        msg.setDeletedAt(Instant.now());
        unsentRepo.save(msg);
        log.info("Unsent message deleted: id={} userId={}", id, userId);
    }

    private UnsentMessage findActive(Long userId, Long id) {
        return unsentRepo.findAll(
                UnsentMessageSpecification.activeByIdForUser(id, userId)
        ).stream().findFirst().orElseThrow(() -> AppException.notFound("Message not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private UnsentMessageResponse toResponse(UnsentMessage m) {
        return UnsentMessageResponse.builder()
                .id(m.getId())
                .content(m.getContent())
                .status(m.getStatus())
                .releasedAt(m.getReleasedAt())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
