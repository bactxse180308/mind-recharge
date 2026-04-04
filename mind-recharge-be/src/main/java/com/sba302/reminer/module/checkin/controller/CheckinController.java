package com.sba302.reminer.module.checkin.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.checkin.dto.request.CheckinRequest;
import com.sba302.reminer.module.checkin.dto.response.CheckinResponse;
import com.sba302.reminer.module.checkin.service.CheckinService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/checkins")
@RequiredArgsConstructor
@Tag(name = "Check-ins", description = "Daily mood check-in")
@SecurityRequirement(name = "bearerAuth")
public class CheckinController {

    private final CheckinService checkinService;

    @PutMapping("/today")
    @Operation(summary = "Upsert today's mood check-in")
    public ApiResponse<CheckinResponse> upsertToday(@Valid @RequestBody CheckinRequest request) {
        return ApiResponse.ok(checkinService.upsertToday(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's check-in")
    public ApiResponse<CheckinResponse> getToday() {
        return ApiResponse.ok(checkinService.getToday(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/history")
    @Operation(summary = "Get check-in history for a date range")
    public ApiResponse<List<CheckinResponse>> history(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(checkinService.getHistory(SecurityUtils.getCurrentUserId(), from, to));
    }
}
