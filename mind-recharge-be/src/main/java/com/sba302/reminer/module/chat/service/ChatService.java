package com.sba302.reminer.module.chat.service;

import com.sba302.reminer.module.chat.dto.request.SendChatMessageRequest;
import com.sba302.reminer.module.chat.dto.response.ChatConversationResponse;
import com.sba302.reminer.module.chat.dto.response.ChatMessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChatService {

    ChatConversationResponse openDirectConversation(Long userId, Long friendUserId);

    ChatConversationResponse openSupportConversation(Long userId);

    Page<ChatConversationResponse> listConversations(Long userId, Pageable pageable);

    Page<ChatMessageResponse> listMessages(Long userId, Long conversationId, Pageable pageable);

    ChatMessageResponse sendMessage(Long userId, Long conversationId, SendChatMessageRequest request);

    void markAsRead(Long userId, Long conversationId);

    void publishTyping(Long userId, Long conversationId, boolean typing);
}
