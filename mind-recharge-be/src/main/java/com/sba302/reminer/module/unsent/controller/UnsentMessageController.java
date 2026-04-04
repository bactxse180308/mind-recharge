package com.sba302.reminer.module.unsent.controller;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.unsent.dto.request.CreateUnsentMessageRequest;
import com.sba302.reminer.module.unsent.dto.response.UnsentMessageResponse;
import com.sba302.reminer.module.unsent.service.UnsentMessageService;
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
@RequestMapping("/api/v1/unsent-messages")
@RequiredArgsConstructor
@Tag(name = "Unsent Messages", description = "Messages written but not sent")
@SecurityRequirement(name = "bearerAuth")
public class UnsentMessageController {

    private final UnsentMessageService unsentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an unsent message")
    public ApiResponse<UnsentMessageResponse> create(@Valid @RequestBody CreateUnsentMessageRequest request) {
        return ApiResponse.created(unsentService.create(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping
    @Operation(summary = "List unsent messages by status")
    public ApiResponse<List<UnsentMessageResponse>> list(
            @RequestParam(defaultValue = "ACTIVE") UnsentMessageStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<UnsentMessageResponse> result = unsentService.list(
                userId, status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @PostMapping("/{id}/release")
    @Operation(summary = "Release / dissolve an unsent message")
    public ApiResponse<UnsentMessageResponse> release(@PathVariable Long id) {
        return ApiResponse.ok(unsentService.release(SecurityUtils.getCurrentUserId(), id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an unsent message")
    public void delete(@PathVariable Long id) {
        unsentService.delete(SecurityUtils.getCurrentUserId(), id);
    }
}
