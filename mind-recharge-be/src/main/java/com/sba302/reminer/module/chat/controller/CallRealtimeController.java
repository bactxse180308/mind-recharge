package com.sba302.reminer.module.chat.controller;

import com.sba302.reminer.module.chat.dto.request.CallSignalRequest;
import com.sba302.reminer.module.chat.service.CallSignalingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class CallRealtimeController {

    private final CallSignalingService callSignalingService;

    @MessageMapping("/call/signal")
    public void signal(@Valid CallSignalRequest request, Principal principal) {
        if (principal == null) {
            return;
        }

        callSignalingService.publishSignal(Long.parseLong(principal.getName()), request);
    }
}
