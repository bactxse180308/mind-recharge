package com.sba302.reminer.module.journal.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.journal.dto.request.CreateJournalRequest;
import com.sba302.reminer.module.journal.dto.request.UpdateJournalRequest;
import com.sba302.reminer.module.journal.dto.response.JournalResponse;
import com.sba302.reminer.module.journal.service.JournalService;
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
@RequestMapping("/api/v1/journal")
@RequiredArgsConstructor
@Tag(name = "Journal", description = "Personal journal entries")
@SecurityRequirement(name = "bearerAuth")
public class JournalController {

    private final JournalService journalService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new journal entry")
    public ApiResponse<JournalResponse> create(@Valid @RequestBody CreateJournalRequest request) {
        return ApiResponse.created(journalService.create(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping
    @Operation(summary = "List journal entries (paginated)")
    public ApiResponse<List<JournalResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        Page<JournalResponse> result = journalService.list(
                userId, PageRequest.of(page, size, Sort.by("entryAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping("/highlight")
    @Operation(summary = "Get highlight entries from 2–4 days ago")
    public ApiResponse<List<JournalResponse>> highlight() {
        return ApiResponse.ok(journalService.getHighlight(SecurityUtils.getCurrentUserId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get single journal entry")
    public ApiResponse<JournalResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(journalService.getById(SecurityUtils.getCurrentUserId(), id));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update journal entry")
    public ApiResponse<JournalResponse> update(@PathVariable Long id,
                                               @RequestBody UpdateJournalRequest request) {
        return ApiResponse.ok(journalService.update(SecurityUtils.getCurrentUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Soft delete journal entry")
    public void delete(@PathVariable Long id) {
        journalService.delete(SecurityUtils.getCurrentUserId(), id);
    }
}
