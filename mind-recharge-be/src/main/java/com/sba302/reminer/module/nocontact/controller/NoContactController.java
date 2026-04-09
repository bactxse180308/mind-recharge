package com.sba302.reminer.module.nocontact.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.nocontact.dto.request.ResetJourneyRequest;
import com.sba302.reminer.module.nocontact.dto.response.NoContactJourneyResponse;
import com.sba302.reminer.module.nocontact.service.NoContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/no-contact")
@RequiredArgsConstructor
@Tag(name = "No Contact", description = "No contact tracker")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class NoContactController {

    private final NoContactService noContactService;

    @GetMapping("/current")
    @Operation(summary = "Get active no-contact journey")
    public ApiResponse<NoContactJourneyResponse> getCurrent() {
        return ApiResponse.ok(noContactService.getCurrent(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start a new no-contact journey")
    public ApiResponse<NoContactJourneyResponse> start() {
        return ApiResponse.created(noContactService.start(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset the active no-contact journey")
    public ApiResponse<NoContactJourneyResponse> reset(@RequestBody(required = false) ResetJourneyRequest request) {
        return ApiResponse.ok(noContactService.reset(
                SecurityUtils.getCurrentUserId(),
                request != null ? request : new ResetJourneyRequest()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get all past journeys")
    public ApiResponse<List<NoContactJourneyResponse>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<NoContactJourneyResponse> result = noContactService.history(
                userId, PageRequest.of(page, size, Sort.by("startedAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    /**
     * Lấy active journey của user cụ thể
     * - ADMIN: xem journey của bất kỳ user nào
     * - USER: chỉ xem journey của chính mình
     */
    @GetMapping("/user/{userId}/current")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get active journey of specific user (ADMIN or own profile)")
    public ApiResponse<NoContactJourneyResponse> getUserCurrent(
            @PathVariable Long userId,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_CURRENT");
        return ApiResponse.ok(noContactService.getCurrent(userId));
    }

    /**
     * Lấy history của user
     */
    @GetMapping("/user/{userId}/history")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get journey history of specific user (ADMIN or own profile)")
    public ApiResponse<List<NoContactJourneyResponse>> getUserHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_HISTORY");
        Page<NoContactJourneyResponse> result = noContactService.history(
                userId, PageRequest.of(page, size, Sort.by("startedAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    /**
     * Start journey cho user
     */
    @PostMapping("/user/{userId}/start")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Start journey for specific user (ADMIN or own profile)")
    public ApiResponse<NoContactJourneyResponse> startForUser(
            @PathVariable Long userId,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "START");
        return ApiResponse.created(noContactService.start(userId));
    }

    /**
     * Reset journey của user
     */
    @PostMapping("/user/{userId}/reset")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Reset journey for specific user (ADMIN or own profile)")
    public ApiResponse<NoContactJourneyResponse> resetForUser(
            @PathVariable Long userId,
            @RequestBody(required = false) ResetJourneyRequest request,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "RESET");
        return ApiResponse.ok(noContactService.reset(
                userId,
                request != null ? request : new ResetJourneyRequest()));
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own no-contact journey [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} no-contact journey [{}]", principal.getEmail(), targetUserId, action);
        }
    }
}

