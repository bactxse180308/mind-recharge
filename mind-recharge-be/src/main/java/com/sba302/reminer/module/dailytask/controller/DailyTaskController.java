package com.sba302.reminer.module.dailytask.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.dailytask.dto.request.UpdateTaskStatusRequest;
import com.sba302.reminer.module.dailytask.dto.response.DailyTaskResponse;
import com.sba302.reminer.module.dailytask.service.DailyTaskService;
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
@RequestMapping("/api/v1/daily-tasks")
@RequiredArgsConstructor
@Tag(name = "Daily Tasks", description = "Daily self-care task checklist")
@SecurityRequirement(name = "bearerAuth")
public class DailyTaskController {

    private final DailyTaskService taskService;

    @GetMapping("/today")
    @Operation(summary = "Get today's task list with completion status")
    public ApiResponse<List<DailyTaskResponse>> getToday() {
        return ApiResponse.ok(taskService.getToday(SecurityUtils.getCurrentUserId()));
    }

    @PutMapping("/{taskCode}/status")
    @Operation(summary = "Update task completion status")
    public ApiResponse<DailyTaskResponse> updateStatus(@PathVariable String taskCode,
                                                        @Valid @RequestBody UpdateTaskStatusRequest request) {
        return ApiResponse.ok(taskService.updateStatus(SecurityUtils.getCurrentUserId(), taskCode, request));
    }

    @GetMapping("/history")
    @Operation(summary = "Get task history for a date range")
    public ApiResponse<List<DailyTaskResponse>> history(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(taskService.getHistory(SecurityUtils.getCurrentUserId(), from, to));
    }
}
