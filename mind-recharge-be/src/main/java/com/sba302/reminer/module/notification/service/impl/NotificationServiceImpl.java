package com.sba302.reminer.module.notification.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.notification.dto.request.CreateNotificationRequest;
import com.sba302.reminer.module.notification.dto.response.NotificationActorResponse;
import com.sba302.reminer.module.notification.dto.response.NotificationRealtimeEventResponse;
import com.sba302.reminer.module.notification.dto.response.NotificationResponse;
import com.sba302.reminer.module.notification.entity.Notification;
import com.sba302.reminer.module.notification.repository.NotificationRepository;
import com.sba302.reminer.module.notification.service.NotificationRealtimeNotifier;
import com.sba302.reminer.module.notification.service.NotificationService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationRealtimeNotifier realtimeNotifier;

    @Override
    public Page<NotificationResponse> listNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> AppException.notFound("Notification not found"));

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notification.setReadAt(Instant.now());
            notificationRepository.save(notification);
            notifyStateChangedAfterCommit(userId, "notification.read", toResponse(notification));
        }

        return toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsReadFalse(userId);
        if (unreadNotifications.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        unreadNotifications.forEach(notification -> {
            notification.setIsRead(true);
            notification.setReadAt(now);
        });
        notificationRepository.saveAll(unreadNotifications);

        notifyStateChangedAfterCommit(userId, "notification.read_all", null);
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> AppException.notFound("Notification recipient not found"));
        User actorUser = request.getActorUserId() == null
                ? null
                : userRepository.findById(request.getActorUserId())
                .orElseThrow(() -> AppException.notFound("Notification actor not found"));

        Notification notification = Notification.builder()
                .user(user)
                .actorUser(actorUser)
                .type(request.getType())
                .title(request.getTitle())
                .body(request.getBody())
                .conversationId(request.getConversationId())
                .messageId(request.getMessageId())
                .payloadJson(request.getPayloadJson())
                .build();
        notificationRepository.save(notification);

        NotificationResponse response = toResponse(notification);
        notifyStateChangedAfterCommit(user.getId(), "notification.created", response);
        return response;
    }

    private void notifyStateChangedAfterCommit(Long userId, String eventType, NotificationResponse notification) {
        runAfterCommit(() -> realtimeNotifier.notifyUser(userId, NotificationRealtimeEventResponse.builder()
                .eventType(eventType)
                .unreadCount(notificationRepository.countByUserIdAndIsReadFalse(userId))
                .notification(notification)
                .build()));
    }

    private void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .body(notification.getBody())
                .isRead(Boolean.TRUE.equals(notification.getIsRead()))
                .readAt(notification.getReadAt())
                .conversationId(notification.getConversationId())
                .messageId(notification.getMessageId())
                .payloadJson(notification.getPayloadJson())
                .actor(toActorResponse(notification.getActorUser()))
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }

    private NotificationActorResponse toActorResponse(User actorUser) {
        if (actorUser == null) {
            return null;
        }

        return NotificationActorResponse.builder()
                .id(actorUser.getId())
                .email(actorUser.getEmail())
                .displayName(actorUser.getDisplayName())
                .avatarUrl(actorUser.getAvatarUrl())
                .avatarKey(actorUser.getAvatarKey())
                .build();
    }
}
