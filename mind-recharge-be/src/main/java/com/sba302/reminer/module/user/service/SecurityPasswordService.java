package com.sba302.reminer.module.user.service;

import com.sba302.reminer.module.user.dto.request.ChangeSecurityPasswordRequest;
import com.sba302.reminer.module.user.dto.request.SecurityPasswordRequest;

public interface SecurityPasswordService {

    /**
     * Setup a new security password.
     */
    void setPassword(Long userId, SecurityPasswordRequest request);

    /**
     * Verify a security password. Throws exception if invalid.
     */
    void verifyPassword(Long userId, String rawPassword);

    /**
     * Change security password.
     */
    void changePassword(Long userId, ChangeSecurityPasswordRequest request);
}
