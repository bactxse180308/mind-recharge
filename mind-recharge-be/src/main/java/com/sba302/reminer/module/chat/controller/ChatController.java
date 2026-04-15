package com.sba302.reminer.module.chat.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.chat.dto.request.ChatTypingRequest;
import com.sba302.reminer.module.chat.dto.request.SendChatMessageRequest;
import com.sba302.reminer.module.chat.dto.response.ChatConversationResponse;
import com.sba302.reminer.module.chat.dto.response.ChatMessageResponse;
import com.sba302.reminer.module.chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Direct chat, support chat, and message history")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations/direct/{friendUserId}")
    @Operation(summary = "Open or create a direct conversation with a friend")
    public ApiResponse<ChatConversationResponse> openDirectConversation(@PathVariable Long friendUserId) {
        return ApiResponse.ok(chatService.openDirectConversation(SecurityUtils.getCurrentUserId(), friendUserId));
    }

    @PostMapping("/conversations/support")
    @Operation(summary = "Open or create the support conversation with admin")
    public ApiResponse<ChatConversationResponse> openSupportConversation() {
        return ApiResponse.ok(chatService.openSupportConversation(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/conversations")
    @Operation(summary = "List current user's conversations")
    public ApiResponse<List<ChatConversationResponse>> listConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ChatConversationResponse> result = chatService.listConversations(
                SecurityUtils.getCurrentUserId(),
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("conversation.lastMessageAt"),
                        Sort.Order.desc("conversation.createdAt")
                ))
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    @Operation(summary = "List messages in a conversation")
    public ApiResponse<List<ChatMessageResponse>> listMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<ChatMessageResponse> result = chatService.listMessages(
                SecurityUtils.getCurrentUserId(),
                conversationId,
                PageRequest.of(page, size, Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id")
                ))
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send a message to a conversation")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendChatMessageRequest request) {
        return ApiResponse.created(chatService.sendMessage(SecurityUtils.getCurrentUserId(), conversationId, request));
    }

    @PostMapping("/conversations/{conversationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Mark a conversation as read for current user")
    public void markAsRead(@PathVariable Long conversationId) {
        chatService.markAsRead(SecurityUtils.getCurrentUserId(), conversationId);
    }

    @PostMapping("/conversations/{conversationId}/typing")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Publish typing state for current user")
    public void typing(
            @PathVariable Long conversationId,
            @Valid @RequestBody ChatTypingRequest request) {
        chatService.publishTyping(SecurityUtils.getCurrentUserId(), conversationId, request.getTyping());
    }
}
