package com.sba302.reminer.module.healing.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.healing.dto.response.HealingTimelineResponse;
import com.sba302.reminer.module.healing.service.HealingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/healing")
@RequiredArgsConstructor
@Tag(name = "Healing Progress", description = "Healing journey timeline tracking")
@SecurityRequirement(name = "bearerAuth")
public class HealingController {

    private final HealingService healingService;

    @GetMapping("/timeline")
    @Operation(summary = "Get user healing journey timeline")
    public ApiResponse<HealingTimelineResponse> getTimeline(
            @RequestParam(defaultValue = "30") int days) {
        return ApiResponse.ok(healingService.getTimeline(SecurityUtils.getCurrentUserId(), days));
    }
}
