package com.sba302.reminer.module.chat.repository;

import com.sba302.reminer.module.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByConversationId(Long conversationId, Pageable pageable);

    Optional<ChatMessage> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    long countByConversationIdAndSenderIdNot(Long conversationId, Long senderId);

    long countByConversationIdAndSenderIdNotAndCreatedAtAfter(Long conversationId, Long senderId, Instant createdAt);
}
