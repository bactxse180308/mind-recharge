package com.sba302.reminer.module.admin.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller - Ví dụ về phân quyền dựa trên role
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    /**
     * Chỉ ADMIN mới có thể truy cập
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Object> getDashboard(Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Admin dashboard - Welcome " + principal.getEmail());
    }

    /**
     * Chỉ ADMIN hoặc USER của chính họ mới có thể truy cập
     */
    @GetMapping("/profile/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> getUserProfile(@PathVariable Long userId, Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "User profile for ID: " + userId + " (Requested by: " + principal.getEmail() + ")");
    }

    /**
     * Chỉ ADMIN mới có thể truy cập
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Object> getAllUsers() {
        return ApiResponse.ok(null, "List of all users");
    }

    /**
     * Tất cả user (ADMIN và USER) đều có thể truy cập
     */
    @GetMapping("/my-profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ApiResponse<Object> getMyProfile(Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "My profile: " + principal.getEmail() + " (Role: " + principal.getRoleName() + ")");
    }

    /**
     * Cập nhật thông tin user - Chỉ ADMIN hoặc chính user đó mới có thể cập nhật
     */
    @PutMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> updateUserInfo(@PathVariable Long userId,
                                              Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "User " + userId + " info updated by " + principal.getEmail());
    }

    /**
     * Xóa user - Chỉ ADMIN hoặc chính user đó mới có thể xóa
     */
    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> deleteUser(@PathVariable Long userId,
                                          Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "User " + userId + " deleted by " + principal.getEmail());
    }

    /**
     * Xem settings của user - Chỉ ADMIN hoặc chính user đó mới có thể xem
     */
    @GetMapping("/users/{userId}/settings")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> getUserSettings(@PathVariable Long userId,
                                               Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Settings for user " + userId + " (accessed by " + principal.getEmail() + ")");
    }

    /**
     * Cập nhật password - Chỉ ADMIN hoặc chính user đó mới có thể cập nhật
     */
    @PostMapping("/users/{userId}/change-password")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> changePassword(@PathVariable Long userId,
                                              Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Password for user " + userId + " changed by " + principal.getEmail());
    }

    /**
     * Xem lịch sử login - Chỉ ADMIN hoặc chính user đó mới có thể xem
     */
    @GetMapping("/users/{userId}/login-history")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> getLoginHistory(@PathVariable Long userId,
                                               Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Login history for user " + userId + " (accessed by " + principal.getEmail() + ")");
    }

    /**
     * Xem notification của user - Chỉ ADMIN hoặc chính user đó mới có thể xem
     */
    @GetMapping("/users/{userId}/notifications")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> getUserNotifications(@PathVariable Long userId,
                                                    Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Notifications for user " + userId + " (accessed by " + principal.getEmail() + ")");
    }

    /**
     * Xóa notification - Chỉ ADMIN hoặc chính user đó mới có thể xóa
     */
    @DeleteMapping("/users/{userId}/notifications/{notificationId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> deleteNotification(@PathVariable Long userId,
                                                  @PathVariable Long notificationId,
                                                  Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Notification " + notificationId + " for user " + userId + " deleted by " + principal.getEmail());
    }

    /**
     * Xem preference của user - Chỉ ADMIN hoặc chính user đó mới có thể xem
     */
    @GetMapping("/users/{userId}/preferences")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> getUserPreferences(@PathVariable Long userId,
                                                  Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Preferences for user " + userId + " (accessed by " + principal.getEmail() + ")");
    }

    /**
     * Cập nhật preference - Chỉ ADMIN hoặc chính user đó mới có thể cập nhật
     */
    @PutMapping("/users/{userId}/preferences")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    public ApiResponse<Object> updateUserPreferences(@PathVariable Long userId,
                                                     Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        return ApiResponse.ok(null, "Preferences for user " + userId + " updated by " + principal.getEmail());
    }
}

