package com.sba302.reminer.module.checkin.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.checkin.dto.request.CheckinRequest;
import com.sba302.reminer.module.checkin.dto.response.CheckinResponse;
import com.sba302.reminer.module.checkin.service.CheckinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/checkins")
@RequiredArgsConstructor
@Tag(name = "Check-ins", description = "Daily mood check-in")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class CheckinController {

    private final CheckinService checkinService;

    @PutMapping("/today")
    @Operation(summary = "Upsert today's mood check-in")
    public ApiResponse<CheckinResponse> upsertToday(@Valid @RequestBody CheckinRequest request) {
        return ApiResponse.ok(checkinService.upsertToday(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's check-in")
    public ApiResponse<CheckinResponse> getToday() {
        return ApiResponse.ok(checkinService.getToday(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get check-in history for a date range")
    public ApiResponse<List<CheckinResponse>> history(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(checkinService.getHistory(SecurityUtils.getCurrentUserId(), from, to));
    }

    /**
     * Lấy check-in của user cụ thể
     * - ADMIN: xem check-in của bất kỳ user nào
     * - USER: chỉ xem check-in của chính mình
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get check-in history of specific user (ADMIN or own profile)")
    public ApiResponse<List<CheckinResponse>> getUserHistory(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_HISTORY");
        return ApiResponse.ok(checkinService.getHistory(userId, from, to));
    }

    /**
     * Tạo/Cập nhật check-in cho user cụ thể
     * - ADMIN: tạo check-in cho bất kỳ user nào
     * - USER: chỉ tạo check-in cho chính mình
     */
    @PostMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Create check-in for specific user (ADMIN or own profile)")
    public ApiResponse<CheckinResponse> createCheckin(
            @PathVariable Long userId,
            @Valid @RequestBody CheckinRequest request,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "CREATE");
        return ApiResponse.ok(checkinService.upsertToday(userId, request));
    }

    /**
     * Lấy check-in hôm nay của user cụ thể
     */
    @GetMapping("/user/{userId}/today")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get today's check-in of specific user (ADMIN or own profile)")
    public ApiResponse<CheckinResponse> getUserToday(
            @PathVariable Long userId,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_TODAY");
        return ApiResponse.ok(checkinService.getToday(userId));
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own check-in [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} check-in [{}]", principal.getEmail(), targetUserId, action);
        }
    }
}


