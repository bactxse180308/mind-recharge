package com.sba302.reminer.module.nocontact.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.nocontact.dto.request.ResetJourneyRequest;
import com.sba302.reminer.module.nocontact.dto.response.NoContactJourneyResponse;
import com.sba302.reminer.module.nocontact.service.NoContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/no-contact")
@RequiredArgsConstructor
@Tag(name = "No Contact", description = "No contact tracker")
@SecurityRequirement(name = "bearerAuth")
public class NoContactController {

    private final NoContactService noContactService;

    @GetMapping("/current")
    @Operation(summary = "Get active no-contact journey")
    public ApiResponse<NoContactJourneyResponse> getCurrent() {
        return ApiResponse.ok(noContactService.getCurrent(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Start a new no-contact journey")
    public ApiResponse<NoContactJourneyResponse> start() {
        return ApiResponse.created(noContactService.start(SecurityUtils.getCurrentUserId()));
    }

    @PostMapping("/reset")
    @Operation(summary = "Reset the active no-contact journey")
    public ApiResponse<NoContactJourneyResponse> reset(@RequestBody(required = false) ResetJourneyRequest request) {
        return ApiResponse.ok(noContactService.reset(
                SecurityUtils.getCurrentUserId(),
                request != null ? request : new ResetJourneyRequest()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get all past journeys")
    public ApiResponse<List<NoContactJourneyResponse>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<NoContactJourneyResponse> result = noContactService.history(
                userId, PageRequest.of(page, size, Sort.by("startedAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }
}
