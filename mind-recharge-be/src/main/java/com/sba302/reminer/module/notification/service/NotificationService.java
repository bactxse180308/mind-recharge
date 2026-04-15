package com.sba302.reminer.module.notification.service;

import com.sba302.reminer.module.notification.dto.request.CreateNotificationRequest;
import com.sba302.reminer.module.notification.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Page<NotificationResponse> listNotifications(Long userId, Pageable pageable);

    long countUnreadNotifications(Long userId);

    NotificationResponse markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);

    NotificationResponse createNotification(CreateNotificationRequest request);
}
