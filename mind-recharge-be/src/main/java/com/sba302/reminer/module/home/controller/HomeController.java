package com.sba302.reminer.module.home.controller;

import com.sba302.reminer.common.enums.JourneyStatus;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.checkin.repository.DailyCheckinRepository;
import com.sba302.reminer.module.dailytask.repository.DailyTaskLogRepository;
import com.sba302.reminer.module.dailytask.repository.DailyTaskTemplateRepository;
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

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

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
    private final DailyTaskTemplateRepository templateRepo;
    private final NoContactJourneyRepository journeyRepo;

    @GetMapping("/summary")
    @Operation(summary = "Get home screen summary data")
    public ApiResponse<HomeSummaryResponse> summary() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepo.findById(userId).orElseThrow();
        final ZoneId zone;
        ZoneId parsedZone;
        try { parsedZone = ZoneId.of(user.getTimezone()); } catch (Exception e) { parsedZone = ZoneId.of("UTC"); }
        zone = parsedZone;

        LocalDate today = LocalDate.now(zone);

        boolean hasCheckinToday = checkinRepo.findByUserIdAndCheckinDate(userId, today).isPresent();

        List<?> todayLogs = taskLogRepo.findByUserIdAndTaskDate(userId, today);
        int totalTasks = templateRepo.findByIsActiveTrueOrderBySortOrderAsc().size();
        long doneTasks = todayLogs.stream()
                .filter(l -> l instanceof com.sba302.reminer.module.dailytask.entity.DailyTaskLog dtl
                        && Boolean.TRUE.equals(dtl.getIsDone()))
                .count();

        Long noContactStreak = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .map(j -> {
                    ZoneId z = zone;
                    java.time.ZonedDateTime start = j.getStartedAt().atZone(z).toLocalDate().atStartOfDay(z);
                    java.time.ZonedDateTime now = java.time.ZonedDateTime.now(z).toLocalDate().atStartOfDay(z);
                    return java.time.Duration.between(start, now).toDays();
                })
                .orElse(null);

        return ApiResponse.ok(HomeSummaryResponse.builder()
                .hasCheckinToday(hasCheckinToday)
                .tasksDoneToday((int) doneTasks)
                .totalTasksToday(totalTasks)
                .noContactStreakDays(noContactStreak)
                .build());
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

        User user = userRepo.findById(userId).orElseThrow();
        final ZoneId zone;
        ZoneId parsedZone;
        try { parsedZone = ZoneId.of(user.getTimezone()); } catch (Exception e) { parsedZone = ZoneId.of("UTC"); }
        zone = parsedZone;

        LocalDate today = LocalDate.now(zone);

        boolean hasCheckinToday = checkinRepo.findByUserIdAndCheckinDate(userId, today).isPresent();

        List<?> todayLogs = taskLogRepo.findByUserIdAndTaskDate(userId, today);
        int totalTasks = templateRepo.findByIsActiveTrueOrderBySortOrderAsc().size();
        long doneTasks = todayLogs.stream()
                .filter(l -> l instanceof com.sba302.reminer.module.dailytask.entity.DailyTaskLog dtl
                        && Boolean.TRUE.equals(dtl.getIsDone()))
                .count();

        Long noContactStreak = journeyRepo.findByUserIdAndStatus(userId, JourneyStatus.ACTIVE)
                .map(j -> {
                    ZoneId z = zone;
                    java.time.ZonedDateTime start = j.getStartedAt().atZone(z).toLocalDate().atStartOfDay(z);
                    java.time.ZonedDateTime now = java.time.ZonedDateTime.now(z).toLocalDate().atStartOfDay(z);
                    return java.time.Duration.between(start, now).toDays();
                })
                .orElse(null);

        return ApiResponse.ok(HomeSummaryResponse.builder()
                .hasCheckinToday(hasCheckinToday)
                .tasksDoneToday((int) doneTasks)
                .totalTasksToday(totalTasks)
                .noContactStreakDays(noContactStreak)
                .build());
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

    @Getter @Builder
    public static class HomeSummaryResponse {
        private boolean hasCheckinToday;
        private int tasksDoneToday;
        private int totalTasksToday;
        private Long noContactStreakDays;  // null if no active journey
    }
}
