package com.sba302.reminer.module.user.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.user.service.TokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
class TokenServiceImpl implements TokenService {

    private static final long EXPIRES_IN_SECONDS = 300; // 5 minutes
    
    // Store token format: userId -> {token, expiresAt}
    private final Map<Long, TokenInfo> validTokens = new ConcurrentHashMap<>();

    @Override
    public String generateUnlockToken(Long userId) {
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(EXPIRES_IN_SECONDS);
        validTokens.put(userId, new TokenInfo(token, expiresAt));
        return token;
    }

    @Override
    public void validateUnlockToken(Long userId, String token) {
        if (token == null || token.isBlank()) {
            throw AppException.unauthorized("Unlock token is required.");
        }

        TokenInfo tokenInfo = validTokens.get(userId);
        if (tokenInfo == null || !tokenInfo.token.equals(token)) {
            throw AppException.unauthorized("Invalid unlock token.");
        }

        if (Instant.now().isAfter(tokenInfo.expiresAt)) {
            validTokens.remove(userId);
            throw AppException.unauthorized("Unlock token has expired. Please unlock again.");
        }
    }

    @Override
    public long getExpiresInSeconds() {
        return EXPIRES_IN_SECONDS;
    }

    private record TokenInfo(String token, Instant expiresAt) {}
}
