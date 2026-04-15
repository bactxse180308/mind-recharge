package com.sba302.reminer.module.home.controller;

import com.sba302.reminer.common.enums.JourneyStatus;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.checkin.repository.DailyCheckinRepository;
import com.sba302.reminer.module.dailytask.repository.DailyTaskLogRepository;
import com.sba302.reminer.module.dailytask.service.DailyTaskTemplateCatalogService;
import com.sba302.reminer.module.nocontact.repository.NoContactJourneyRepository;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/v1/home")
@RequiredArgsConstructor
@Tag(name = "Home", description = "Home screen summary")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class HomeController {

    private final UserRepository userRepo;
    private final DailyCheckinRepository checkinRepo;
    private final DailyTaskLogRepository taskLogRepo;
    private final DailyTaskTemplateCatalogService templateCatalogService;
    private final NoContactJourneyRepository journeyRepo;

    @GetMapping("/summary")
    @Operation(summary = "Get home screen summary data")
    public ApiResponse<HomeSummaryResponse> summary() {
        return ApiResponse.ok(buildSummary(SecurityUtils.getCurrentUserId()));
    }

    /**
     * Lấy summary của user cụ thể
     * - ADMIN: xem summary của bất kỳ user nào
     * - USER: chỉ xem summary của chính mình
     */
    @GetMapping("/user/{userId}/summary")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get home summary of specific user (ADMIN or own profile)")
    public ApiResponse<HomeSummaryResponse> getUserSummary(
            @PathVariable Long userId,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_SUMMARY");
        return ApiResponse.ok(buildSummary(userId));
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own home summary [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} home summary [{}]", principal.getEmail(), targetUserId, action);
        }
    }

    private HomeSummaryResponse buildSummary(Long userId) {
        User user = userRepo.findById(userId).orElseThrow();
        ZoneId zone = resolveZone(user.getTimezone());
        LocalDate today = LocalDate.now(zone);

        boolean hasCheckinToday = checkinRepo.existsByUserIdAndCheckinDate(userId, today);
        int totalTasks = templateCatalogService.getActiveTemplateCount();
        int doneTasks = Math.toIntExact(taskLogRepo.countByUserIdAndTaskDateAndIsDoneTrue(userId, today));
        Long noContactStreak = journeyRepo.findStartedAtByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .map(startedAt -> calculateStreakDays(startedAt, zone))
                .orElse(null);

        return HomeSummaryResponse.builder()
                .hasCheckinToday(hasCheckinToday)
                .tasksDoneToday(doneTasks)
                .totalTasksToday(totalTasks)
                .noContactStreakDays(noContactStreak)
                .build();
    }

    private ZoneId resolveZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }

    private long calculateStreakDays(Instant startedAt, ZoneId zone) {
        java.time.ZonedDateTime start = startedAt.atZone(zone).toLocalDate().atStartOfDay(zone);
        java.time.ZonedDateTime now = java.time.ZonedDateTime.now(zone).toLocalDate().atStartOfDay(zone);
        return java.time.Duration.between(start, now).toDays();
    }

    @Getter @Builder
    public static class HomeSummaryResponse {
        private boolean hasCheckinToday;
        private int tasksDoneToday;
        private int totalTasksToday;
        private Long noContactStreakDays;  // null if no active journey
    }
}
