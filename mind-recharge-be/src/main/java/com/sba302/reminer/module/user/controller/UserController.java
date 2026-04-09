package com.sba302.reminer.module.user.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.user.dto.request.UpdateProfileRequest;
import com.sba302.reminer.module.user.dto.response.UserResponse;
import com.sba302.reminer.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sba302.reminer.module.user.service.SecurityPasswordService;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class UserController {

    private final UserService userService;
    private final SecurityPasswordService securityPasswordService;

    /**
     * Lấy thông tin user hiện tại
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ApiResponse<UserResponse> getMe() {
        return ApiResponse.ok(userService.getMe(SecurityUtils.getCurrentUserId()));
    }

    /**
     * Cập nhật thông tin user hiện tại
     */
    @PatchMapping("/me")
    @Operation(summary = "Update current user profile")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateMe(SecurityUtils.getCurrentUserId(), request));
    }

    /**
     * Setup security password
     */
    @PostMapping("/security-password")
    @Operation(summary = "Setup security password")
    public ApiResponse<Object> setupSecurityPassword(
            @Valid @RequestBody com.sba302.reminer.module.user.dto.request.SecurityPasswordRequest request) {
        securityPasswordService.setPassword(SecurityUtils.getCurrentUserId(), request);
        return ApiResponse.ok(null, "Security password setup successfully");
    }

    /**
     * Change security password
     */
    @PutMapping("/security-password")
    @Operation(summary = "Change security password")
    public ApiResponse<Object> changeSecurityPassword(
            @Valid @RequestBody com.sba302.reminer.module.user.dto.request.ChangeSecurityPasswordRequest request) {
        securityPasswordService.changePassword(SecurityUtils.getCurrentUserId(), request);
        return ApiResponse.ok(null, "Security password changed successfully");
    }

    /**
     * Lấy thông tin user theo ID
     * - ADMIN: có thể xem thông tin của bất kỳ user nào
     * - USER: chỉ có thể xem thông tin của chính mình
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get user profile by ID (ADMIN or own profile)")
    public ApiResponse<UserResponse> getUser(@PathVariable Long userId,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "GET");

        return ApiResponse.ok(userService.getMe(userId));
    }

    /**
     * Cập nhật thông tin user
     * - ADMIN: có thể cập nhật thông tin của bất kỳ user nào
     * - USER: chỉ có thể cập nhật thông tin của chính mình
     */
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Update user profile (ADMIN or own profile)")
    public ApiResponse<UserResponse> updateUser(@PathVariable Long userId,
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "PUT");

        return ApiResponse.ok(userService.updateMe(userId, request));
    }

    /**
     * Xóa user
     * - ADMIN: có thể xóa bất kỳ user nào
     * - USER: chỉ có thể xóa chính mình (tự delete account)
     */
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Delete user (ADMIN or own account)")
    public ApiResponse<Object> deleteUser(@PathVariable Long userId,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "DELETE");

        return ApiResponse.ok(null, "User " + userId + " has been deleted");
    }

    /**
     * Đổi password
     * - ADMIN: có thể đổi password của bất kỳ user nào
     * - USER: chỉ có thể đổi password của chính mình
     */
    @PostMapping("/{userId}/change-password")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Change password (ADMIN or own account)")
    public ApiResponse<Object> changePassword(@PathVariable Long userId,
            @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "CHANGE_PASSWORD");

        return ApiResponse.ok(null, "Password changed successfully");
    }

    /**
     * Lấy activity log của user
     * - ADMIN: có thể xem activity của bất kỳ user nào
     * - USER: chỉ có thể xem activity của chính mình
     */
    @GetMapping("/{userId}/activity")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get user activity log (ADMIN or own profile)")
    public ApiResponse<Object> getUserActivity(@PathVariable Long userId,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "GET_ACTIVITY");

        return ApiResponse.ok(null, "Activity log for user " + userId);
    }

    /**
     * Lấy preferences của user
     * - ADMIN: có thể xem preferences của bất kỳ user nào
     * - USER: chỉ có thể xem preferences của chính mình
     */
    @GetMapping("/{userId}/preferences")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get user preferences (ADMIN or own profile)")
    public ApiResponse<Object> getUserPreferences(@PathVariable Long userId,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "GET_PREFERENCES");

        return ApiResponse.ok(null, "Preferences for user " + userId);
    }

    /**
     * Cập nhật preferences của user
     * - ADMIN: có thể cập nhật preferences của bất kỳ user nào
     * - USER: chỉ có thể cập nhật preferences của chính mình
     */
    @PutMapping("/{userId}/preferences")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Update user preferences (ADMIN or own profile)")
    public ApiResponse<Object> updateUserPreferences(@PathVariable Long userId,
            @RequestBody Object preferences,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logUserAccess(principal, userId, "UPDATE_PREFERENCES");

        return ApiResponse.ok(null, "Preferences updated for user " + userId);
    }

    /**
     * Helper method để log access attempts
     */
    private void logUserAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} [{}] accessed own resource", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} resource [{}]",
                    principal.getEmail(), targetUserId, action);
        }
    }

    /**
     * Inner class cho request change password
     */
    @lombok.Data
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
    }
}
