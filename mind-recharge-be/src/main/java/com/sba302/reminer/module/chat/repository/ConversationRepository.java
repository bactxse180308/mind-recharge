package com.sba302.reminer.module.chat.repository;

import com.sba302.reminer.common.enums.ChatConversationType;
import com.sba302.reminer.module.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByTypeAndFriendshipId(ChatConversationType type, Long friendshipId);

    Optional<Conversation> findByTypeAndSupportUserId(ChatConversationType type, Long supportUserId);
}
