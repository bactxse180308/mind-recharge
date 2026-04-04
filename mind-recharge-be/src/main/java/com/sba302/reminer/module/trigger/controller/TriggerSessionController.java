package com.sba302.reminer.module.trigger.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.trigger.dto.response.TriggerSessionResponse;
import com.sba302.reminer.module.trigger.service.TriggerSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/emotional-trigger/sessions")
@RequiredArgsConstructor
@Tag(name = "Emotional Trigger", description = "10-minute cool-down sessions")
@SecurityRequirement(name = "bearerAuth")
public class TriggerSessionController {

    private final TriggerSessionService triggerService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start a new trigger session (600s default)")
    public ApiResponse<TriggerSessionResponse> start() {
        return ApiResponse.created(triggerService.start(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark session as completed")
    public ApiResponse<TriggerSessionResponse> complete(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.complete(SecurityUtils.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel the session")
    public ApiResponse<TriggerSessionResponse> cancel(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.cancel(SecurityUtils.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/redirect-to-unsent")
    @Operation(summary = "Redirect session to unsent messages flow")
    public ApiResponse<TriggerSessionResponse> redirectToUnsent(@PathVariable Long id) {
        return ApiResponse.ok(triggerService.redirectToUnsent(SecurityUtils.getCurrentUserId(), id));
    }
}
