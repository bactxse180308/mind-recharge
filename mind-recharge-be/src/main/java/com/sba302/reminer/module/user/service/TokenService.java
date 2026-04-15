package com.sba302.reminer.module.user.service;

public interface TokenService {

    /**
     * Generate an unlock token valid for specified minutes.
     * @return the token string
     */
    String generateUnlockToken(Long userId);

    /**
     * Validate unlock token. Throws Exception if invalid or expired.
     */
    void validateUnlockToken(Long userId, String token);

    /**
     * Get expiration time in seconds
     */
    long getExpiresInSeconds();
}
