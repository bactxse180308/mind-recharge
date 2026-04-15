package com.sba302.reminer.module.journal.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.security.CustomUserPrincipal;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/journal")
@RequiredArgsConstructor
@Tag(name = "Journal", description = "Personal journal entries")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
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

    /**
     * Lấy journal entries của user cụ thể
     * - ADMIN: xem journal của bất kỳ user nào
     * - USER: chỉ xem journal của chính mình
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get journal entries of specific user (ADMIN or own profile)")
    public ApiResponse<List<JournalResponse>> getUserEntries(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET_LIST");
        Page<JournalResponse> result = journalService.list(
                userId, PageRequest.of(page, size, Sort.by("entryAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    /**
     * Lấy journal entry cụ thể của user
     */
    @GetMapping("/user/{userId}/{id}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get specific journal entry of user (ADMIN or own profile)")
    public ApiResponse<JournalResponse> getUserEntry(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "GET");
        return ApiResponse.ok(journalService.getById(userId, id));
    }

    /**
     * Tạo journal entry cho user cụ thể
     */
    @PostMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Create journal entry for specific user (ADMIN or own profile)")
    public ApiResponse<JournalResponse> createForUser(
            @PathVariable Long userId,
            @Valid @RequestBody CreateJournalRequest request,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "CREATE");
        return ApiResponse.created(journalService.create(userId, request));
    }

    /**
     * Cập nhật journal entry của user
     */
    @PatchMapping("/user/{userId}/{id}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Update journal entry of user (ADMIN or own profile)")
    public ApiResponse<JournalResponse> updateForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            @RequestBody UpdateJournalRequest request,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "UPDATE");
        return ApiResponse.ok(journalService.update(userId, id, request));
    }

    /**
     * Xóa journal entry của user
     */
    @DeleteMapping("/user/{userId}/{id}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Delete journal entry of user (ADMIN or own profile)")
    public void deleteForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "DELETE");
        journalService.delete(userId, id);
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own journal [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} journal [{}]", principal.getEmail(), targetUserId, action);
        }
    }
}


