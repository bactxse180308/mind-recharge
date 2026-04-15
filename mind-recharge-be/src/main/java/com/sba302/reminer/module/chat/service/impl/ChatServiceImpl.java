package com.sba302.reminer.module.chat.service.impl;

import com.sba302.reminer.common.enums.ChatConversationType;
import com.sba302.reminer.common.enums.ChatMessageType;
import com.sba302.reminer.common.enums.ChatParticipantRole;
import com.sba302.reminer.common.enums.NotificationType;
import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.chat.dto.request.SendChatMessageRequest;
import com.sba302.reminer.module.chat.dto.response.*;
import com.sba302.reminer.module.chat.entity.ChatMessage;
import com.sba302.reminer.module.chat.entity.Conversation;
import com.sba302.reminer.module.chat.entity.ConversationParticipant;
import com.sba302.reminer.module.chat.repository.ChatMessageRepository;
import com.sba302.reminer.module.chat.repository.ConversationParticipantRepository;
import com.sba302.reminer.module.chat.repository.ConversationRepository;
import com.sba302.reminer.module.chat.service.ChatRealtimeNotifier;
import com.sba302.reminer.module.chat.service.ChatService;
import com.sba302.reminer.module.friend.entity.Friendship;
import com.sba302.reminer.module.friend.repository.FriendshipRepository;
import com.sba302.reminer.module.friend.repository.FriendshipSpecification;
import com.sba302.reminer.module.notification.dto.request.CreateNotificationRequest;
import com.sba302.reminer.module.notification.service.NotificationService;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final ChatRealtimeNotifier realtimeNotifier;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ChatConversationResponse openDirectConversation(Long userId, Long friendUserId) {
        Friendship friendship = friendshipRepository.findOne(FriendshipSpecification.betweenUsers(userId, friendUserId))
                .orElseThrow(() -> AppException.forbidden("You can only chat directly with friends"));

        Conversation conversation = conversationRepository
                .findByTypeAndFriendshipId(ChatConversationType.DIRECT, friendship.getId())
                .orElseGet(() -> createDirectConversation(findUser(userId), findUser(friendUserId), friendship));

        return toConversationResponse(userId, conversation);
    }

    @Override
    @Transactional
    public ChatConversationResponse openSupportConversation(Long userId) {
        User currentUser = findUser(userId);
        if ("ADMIN".equals(currentUser.getRole().getRoleName())) {
            throw AppException.badRequest("Admin users do not create support conversations from this endpoint");
        }

        Conversation conversation = conversationRepository
                .findByTypeAndSupportUserId(ChatConversationType.SUPPORT, userId)
                .orElseGet(() -> createSupportConversation(currentUser));

        return toConversationResponse(userId, conversation);
    }

    @Override
    public Page<ChatConversationResponse> listConversations(Long userId, Pageable pageable) {
        return participantRepository.findByUserId(userId, pageable)
                .map(participant -> toConversationResponse(userId, participant.getConversation()));
    }

    @Override
    public Page<ChatMessageResponse> listMessages(Long userId, Long conversationId, Pageable pageable) {
        ensureParticipant(userId, conversationId);
        return chatMessageRepository.findByConversationId(conversationId, pageable)
                .map(message -> toMessageResponse(userId, message));
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(Long userId, Long conversationId, SendChatMessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> AppException.notFound("Conversation not found"));
        ConversationParticipant senderParticipant = ensureParticipant(userId, conversationId);

        if (!StringUtils.hasText(request.getContent()) && !StringUtils.hasText(request.getImageUrl())) {
            throw AppException.badRequest("Content or image is required");
        }

        ChatMessageType messageType = StringUtils.hasText(request.getImageUrl())
                ? ChatMessageType.IMAGE
                : ChatMessageType.TEXT;

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(senderParticipant.getUser())
                .type(messageType)
                .content(StringUtils.hasText(request.getContent()) ? request.getContent().trim() : null)
                .imageUrl(request.getImageUrl())
                .imageKey(request.getImageKey())
                .build();
        chatMessageRepository.save(message);

        Instant now = Instant.now();
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);
        senderParticipant.setLastReadAt(now);
        participantRepository.save(senderParticipant);

        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversationId);
        participants.stream()
                .filter(participant -> !participant.getUser().getId().equals(userId))
                .forEach(participant -> notificationService.createNotification(CreateNotificationRequest.builder()
                        .userId(participant.getUser().getId())
                        .actorUserId(senderParticipant.getUser().getId())
                        .type(NotificationType.CHAT_MESSAGE)
                        .title(senderParticipant.getUser().getDisplayName())
                        .body(buildNotificationBody(message))
                        .conversationId(conversation.getId())
                        .messageId(message.getId())
                        .payloadJson("""
                                {"conversationId":%d,"messageId":%d}
                                """.formatted(conversation.getId(), message.getId()).trim())
                        .build()));
        notifyMessageCreatedAfterCommit(
                conversation.getId(),
                message.getId(),
                participants.stream()
                        .map(participant -> participant.getUser().getId())
                        .toList()
        );

        log.info("Chat message created: conversationId={} senderId={} messageId={}", conversationId, userId, message.getId());
        return toMessageResponse(userId, message);
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long conversationId) {
        ConversationParticipant participant = ensureParticipant(userId, conversationId);
        participant.setLastReadAt(Instant.now());
        participantRepository.save(participant);

        List<Long> targetUserIds = participantRepository.findByConversationId(conversationId).stream()
                .map(conversationParticipant -> conversationParticipant.getUser().getId())
                .toList();

        notifyConversationReadAfterCommit(participant.getConversation().getId(), targetUserIds);
    }

    @Override
    public void publishTyping(Long userId, Long conversationId, boolean typing) {
        ConversationParticipant senderParticipant = ensureParticipant(userId, conversationId);
        Conversation conversation = senderParticipant.getConversation();

        participantRepository.findByConversationId(conversationId).stream()
                .filter(participant -> !participant.getUser().getId().equals(userId))
                .forEach(participant -> realtimeNotifier.notifyUser(participant.getUser().getId(),
                        ChatRealtimeEventResponse.builder()
                                .eventType("chat.typing")
                                .conversation(toConversationResponse(participant.getUser().getId(), conversation))
                                .typingUser(toUserSummary(senderParticipant.getUser()))
                                .typing(typing)
                                .build()));
    }

    private Conversation createDirectConversation(User user, User friend, Friendship friendship) {
        Conversation conversation = Conversation.builder()
                .type(ChatConversationType.DIRECT)
                .createdBy(user)
                .friendship(friendship)
                .build();
        conversationRepository.save(conversation);

        participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(user)
                .role(ChatParticipantRole.MEMBER)
                .build());
        participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(friend)
                .role(ChatParticipantRole.MEMBER)
                .build());
        return conversation;
    }

    private Conversation createSupportConversation(User supportUser) {
        User adminUser = userRepository.findFirstByRoleRoleNameOrderByIdAsc("ADMIN")
                .orElseThrow(() -> AppException.notFound("Admin account not found"));

        Conversation conversation = Conversation.builder()
                .type(ChatConversationType.SUPPORT)
                .createdBy(supportUser)
                .supportUser(supportUser)
                .build();
        conversationRepository.save(conversation);

        participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(supportUser)
                .role(ChatParticipantRole.MEMBER)
                .build());
        participantRepository.save(ConversationParticipant.builder()
                .conversation(conversation)
                .user(adminUser)
                .role(ChatParticipantRole.SUPPORT_AGENT)
                .build());
        return conversation;
    }

    private ConversationParticipant ensureParticipant(Long userId, Long conversationId) {
        return participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> AppException.forbidden("You are not a participant in this conversation"));
    }

    private ChatConversationResponse toConversationResponse(Long currentUserId, Conversation conversation) {
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());
        ChatMessageResponse lastMessage = chatMessageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .map(message -> toMessageResponse(currentUserId, message))
                .orElse(null);
        ChatUserSummaryResponse counterpart = participants.stream()
                .map(ConversationParticipant::getUser)
                .filter(user -> !user.getId().equals(currentUserId))
                .findFirst()
                .map(this::toUserSummary)
                .orElse(null);
        List<ChatUserSummaryResponse> participantResponses = participants.stream()
                .map(ConversationParticipant::getUser)
                .map(this::toUserSummary)
                .toList();

        ConversationParticipant currentParticipant = participants.stream()
                .filter(participant -> participant.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElse(null);
        ConversationParticipant counterpartParticipant = participants.stream()
                .filter(participant -> !participant.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElse(null);
        long unreadCount = currentParticipant == null
                ? 0
                : countUnreadMessages(conversation.getId(), currentUserId, currentParticipant.getLastReadAt());

        return ChatConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .counterpart(counterpart)
                .participants(participantResponses)
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .counterpartLastReadAt(counterpartParticipant == null ? null : counterpartParticipant.getLastReadAt())
                .lastMessageAt(conversation.getLastMessageAt())
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }

    private long countUnreadMessages(Long conversationId, Long userId, Instant lastReadAt) {
        if (lastReadAt == null) {
            return chatMessageRepository.countByConversationIdAndSenderIdNot(conversationId, userId);
        }
        return chatMessageRepository.countByConversationIdAndSenderIdNotAndCreatedAtAfter(conversationId, userId, lastReadAt);
    }

    private String buildNotificationBody(ChatMessage message) {
        if (StringUtils.hasText(message.getContent())) {
            String content = message.getContent().trim();
            return content.length() <= 160 ? content : content.substring(0, 157) + "...";
        }

        if (StringUtils.hasText(message.getImageUrl()) || StringUtils.hasText(message.getImageKey())) {
            return "Đã gửi một hình ảnh";
        }

        return "Bạn có một tin nhắn mới";
    }

    private void notifyMessageCreatedAfterCommit(Long conversationId, Long messageId, List<Long> targetUserIds) {
        runAfterCommit(() -> {
            Conversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> AppException.notFound("Conversation not found"));
            ChatMessage message = chatMessageRepository.findById(messageId)
                    .orElseThrow(() -> AppException.notFound("Message not found"));

            for (Long targetUserId : targetUserIds) {
                realtimeNotifier.notifyUser(targetUserId, ChatRealtimeEventResponse.builder()
                        .eventType("chat.message.created")
                        .conversation(toConversationResponse(targetUserId, conversation))
                        .message(toMessageResponse(targetUserId, message))
                        .build());
            }
        });
    }

    private void notifyConversationReadAfterCommit(Long conversationId, List<Long> targetUserIds) {
        runAfterCommit(() -> {
            Conversation conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> AppException.notFound("Conversation not found"));

            for (Long targetUserId : targetUserIds) {
                realtimeNotifier.notifyUser(targetUserId, ChatRealtimeEventResponse.builder()
                        .eventType("chat.conversation.read")
                        .conversation(toConversationResponse(targetUserId, conversation))
                        .build());
            }
        });
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

    private ChatMessageResponse toMessageResponse(Long currentUserId, ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .type(message.getType())
                .content(message.getContent())
                .imageUrl(message.getImageUrl())
                .imageKey(message.getImageKey())
                .sender(toUserSummary(message.getSender()))
                .mine(message.getSender().getId().equals(currentUserId))
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }

    private ChatUserSummaryResponse toUserSummary(User user) {
        return ChatUserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .avatarKey(user.getAvatarKey())
                .build();
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }
}
