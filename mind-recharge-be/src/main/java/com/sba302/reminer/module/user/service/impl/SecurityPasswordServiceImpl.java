package com.sba302.reminer.module.user.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.user.dto.request.ChangeSecurityPasswordRequest;
import com.sba302.reminer.module.user.dto.request.SecurityPasswordRequest;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import com.sba302.reminer.module.user.service.SecurityPasswordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
class SecurityPasswordServiceImpl implements SecurityPasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_TIME_MINUTES = 5;

    @Override
    @Transactional
    public void setPassword(Long userId, SecurityPasswordRequest request) {
        User user = getUser(userId);
        
        if (user.getSecurityPasswordHash() != null) {
            throw AppException.badRequest("Security password is already set. Please use change password.");
        }

        user.setSecurityPasswordHash(passwordEncoder.encode(request.getSecurityPassword()));
        user.setSecurityPasswordUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Security password set for user {}", userId);
    }

    @Override
    @Transactional
    public void verifyPassword(Long userId, String rawPassword) {
        User user = getUser(userId);

        if (user.getSecurityPasswordHash() == null) {
            throw AppException.badRequest("Security password not configured.");
        }

        checkAndClearLock(user);

        if (!passwordEncoder.matches(rawPassword, user.getSecurityPasswordHash())) {
            recordFailedAttempt(user);
            throw AppException.unauthorized("Invalid security password.");
        }

        // Reset rate limit on success
        clearRateLimit(user);
        log.info("Security password verified for user {}", userId);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangeSecurityPasswordRequest request) {
        User user = getUser(userId);

        if (user.getSecurityPasswordHash() == null) {
            throw AppException.badRequest("Security password not configured.");
        }

        checkAndClearLock(user);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getSecurityPasswordHash())) {
            recordFailedAttempt(user);
            throw AppException.unauthorized("Invalid old security password.");
        }

        clearRateLimit(user);
        
        user.setSecurityPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setSecurityPasswordUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Security password changed for user {}", userId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found: " + userId));
    }

    private void checkAndClearLock(User user) {
        if (user.getSecurityPasswordLockedUntil() != null) {
            if (Instant.now().isBefore(user.getSecurityPasswordLockedUntil())) {
                throw AppException.forbidden("Too many failed attempts. Try again later.");
            } else {
                // Lock expired -> reset lock
                user.setSecurityPasswordLockedUntil(null);
                user.setSecurityPasswordFailedAttempts(0);
                userRepository.save(user);
            }
        }
    }

    private void recordFailedAttempt(User user) {
        int attempts = user.getSecurityPasswordFailedAttempts() == null ? 0 : user.getSecurityPasswordFailedAttempts();
        attempts++;
        user.setSecurityPasswordFailedAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setSecurityPasswordLockedUntil(Instant.now().plus(LOCK_TIME_MINUTES, ChronoUnit.MINUTES));
            log.warn("User {} is locked out of security features due to {} failed attempts", user.getId(), MAX_FAILED_ATTEMPTS);
        }
        userRepository.save(user);
    }

    private void clearRateLimit(User user) {
        if (user.getSecurityPasswordFailedAttempts() != null && user.getSecurityPasswordFailedAttempts() > 0) {
            user.setSecurityPasswordFailedAttempts(0);
            user.setSecurityPasswordLockedUntil(null);
            userRepository.save(user);
        }
    }
}
