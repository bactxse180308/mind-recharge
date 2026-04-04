package com.sba302.reminer.common.util;

import lombok.experimental.UtilityClass;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@UtilityClass
public class SecurityUtils {

    /**
     * Returns the authenticated user's Long id from the SecurityContext.
     * The JWT subject is the userId (String), set in JwtTokenProvider#generateAccessToken.
     */
    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user in context");
        }
        return Long.parseLong(auth.getName());
    }
}
