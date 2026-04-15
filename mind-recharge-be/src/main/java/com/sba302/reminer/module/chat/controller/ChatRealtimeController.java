package com.sba302.reminer.module.chat.controller;

import com.sba302.reminer.module.chat.dto.request.ChatTypingRequest;
import com.sba302.reminer.module.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatRealtimeController {

    private final ChatService chatService;

    @MessageMapping("/chat/typing")
    public void typing(@Valid ChatTypingRequest request, Principal principal) {
        if (principal == null) {
            return;
        }

        chatService.publishTyping(Long.parseLong(principal.getName()), request.getConversationId(), request.getTyping());
    }
}
