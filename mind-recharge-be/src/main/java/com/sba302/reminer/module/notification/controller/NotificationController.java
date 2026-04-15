package com.sba302.reminer.module.notification.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.notification.dto.response.NotificationResponse;
import com.sba302.reminer.module.notification.dto.response.NotificationUnreadCountResponse;
import com.sba302.reminer.module.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User inbox notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List current user's notifications")
    public ApiResponse<List<NotificationResponse>> listNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<NotificationResponse> result = notificationService.listNotifications(
                SecurityUtils.getCurrentUserId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get current user's unread notification count")
    public ApiResponse<NotificationUnreadCountResponse> getUnreadCount() {
        return ApiResponse.ok(NotificationUnreadCountResponse.builder()
                .unreadCount(notificationService.countUnreadNotifications(SecurityUtils.getCurrentUserId()))
                .build());
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "Mark one notification as read")
    public ApiResponse<NotificationResponse> markAsRead(@PathVariable Long notificationId) {
        return ApiResponse.ok(notificationService.markAsRead(SecurityUtils.getCurrentUserId(), notificationId));
    }

    @PostMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead(SecurityUtils.getCurrentUserId());
        return ApiResponse.noContent();
    }
}
