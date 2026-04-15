package com.sba302.reminer.module.trigger.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.trigger.dto.response.TriggerSessionResponse;
import com.sba302.reminer.module.trigger.service.TriggerSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/emotional-trigger/sessions")
@RequiredArgsConstructor
@Tag(name = "Emotional Trigger", description = "10-minute cool-down sessions")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class TriggerSessionController {

    private final TriggerSessionService triggerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start a new trigger session (600s default)")
    public ApiResponse<TriggerSessionResponse> start() {
        return ApiResponse.created(triggerService.start(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark session as completed")
    public ApiResponse<TriggerSessionResponse> complete(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.complete(SecurityUtils.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel the session")
    public ApiResponse<TriggerSessionResponse> cancel(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.cancel(SecurityUtils.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/redirect-to-unsent")
    @Operation(summary = "Redirect session to unsent messages flow")
    public ApiResponse<TriggerSessionResponse> redirectToUnsent(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.redirectToUnsent(SecurityUtils.getCurrentUserId(), id));
    }

    /**
     * Start session cho user cụ thể
     * - ADMIN: start session cho bất kỳ user nào
     * - USER: chỉ start session cho chính mình
     */
    @PostMapping("/user/{userId}/start")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Start trigger session for specific user (ADMIN or own profile)")
    public ApiResponse<TriggerSessionResponse> startForUser(
            @PathVariable Long userId,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "START");
        return ApiResponse.created(triggerService.start(userId));
    }

    /**
     * Complete session của user
     */
    @PostMapping("/user/{userId}/{id}/complete")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Complete session of specific user (ADMIN or own profile)")
    public ApiResponse<TriggerSessionResponse> completeForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "COMPLETE");
        return ApiResponse.ok(triggerService.complete(userId, id));
    }

    /**
     * Cancel session của user
     */
    @PostMapping("/user/{userId}/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Cancel session of specific user (ADMIN or own profile)")
    public ApiResponse<TriggerSessionResponse> cancelForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "CANCEL");
        return ApiResponse.ok(triggerService.cancel(userId, id));
    }

    /**
     * Redirect session của user
     */
    @PostMapping("/user/{userId}/{id}/redirect-to-unsent")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Redirect session to unsent of specific user (ADMIN or own profile)")
    public ApiResponse<TriggerSessionResponse> redirectToUnsentForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "REDIRECT");
        return ApiResponse.ok(triggerService.redirectToUnsent(userId, id));
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own trigger session [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} trigger session [{}]", principal.getEmail(), targetUserId, action);
        }
    }
}

