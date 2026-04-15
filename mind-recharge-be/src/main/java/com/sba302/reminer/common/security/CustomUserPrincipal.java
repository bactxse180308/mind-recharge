package com.sba302.reminer.common.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Custom Principal chứa thông tin user từ JWT token
 */
@Getter
@AllArgsConstructor
public class CustomUserPrincipal {
    private Long userId;
    private String email;
    private String roleName;

    @Override
    public String toString() {
        return userId.toString();
    }
}

