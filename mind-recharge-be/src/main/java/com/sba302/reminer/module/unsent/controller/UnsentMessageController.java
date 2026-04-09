package com.sba302.reminer.module.unsent.controller;

import com.sba302.reminer.common.enums.UnsentMessageStatus;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.unsent.dto.request.CreateUnsentMessageRequest;
import com.sba302.reminer.module.unsent.dto.response.UnsentMessageResponse;
import com.sba302.reminer.module.unsent.service.UnsentMessageService;
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
@RequestMapping("/api/v1/unsent-messages")
@RequiredArgsConstructor
@Tag(name = "Unsent Messages", description = "Messages written but not sent")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class UnsentMessageController {

    private final UnsentMessageService unsentService;
    private final com.sba302.reminer.module.user.service.SecurityPasswordService securityPasswordService;
    private final com.sba302.reminer.module.user.service.TokenService tokenService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an unsent message")
    public ApiResponse<UnsentMessageResponse> create(@Valid @RequestBody CreateUnsentMessageRequest request) {
        return ApiResponse.created(unsentService.create(SecurityUtils.getCurrentUserId(), request));
    }

    @PostMapping("/unlock")
    @Operation(summary = "Unlock unsent messages")
    public ApiResponse<com.sba302.reminer.module.unsent.dto.response.UnlockTokenResponse> unlock(@Valid @RequestBody com.sba302.reminer.module.unsent.dto.request.UnlockUnsentMessageRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        securityPasswordService.verifyPassword(userId, request.getSecurityPassword());
        
        String token = tokenService.generateUnlockToken(userId);
        return ApiResponse.ok(com.sba302.reminer.module.unsent.dto.response.UnlockTokenResponse.builder()
                .unlockToken(token)
                .expiresIn(tokenService.getExpiresInSeconds())
                .build());
    }

    @GetMapping
    @Operation(summary = "List unsent messages by status")
    public ApiResponse<List<UnsentMessageResponse>> list(
            @RequestHeader(value = "X-Unlock-Token", required = true) String unlockToken,
            @RequestParam(defaultValue = "ACTIVE") UnsentMessageStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        tokenService.validateUnlockToken(userId, unlockToken);

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

    /**
     * Lấy unsent messages của user cụ thể
     * - ADMIN: xem messages của bất kỳ user nào
     * - USER: chỉ xem messages của chính mình
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Get unsent messages of specific user (ADMIN or own profile)")
    public ApiResponse<List<UnsentMessageResponse>> getUserMessages(
            @PathVariable Long userId,
            @RequestHeader(value = "X-Unlock-Token", required = false) String unlockToken,
            @RequestParam(defaultValue = "ACTIVE") UnsentMessageStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        logAccess(principal, userId, "GET_LIST");

        // Validate token ONLY IF it's not ADMIN viewing other's profile
        if (!"ADMIN".equals(principal.getRoleName()) || principal.getUserId().equals(userId)) {
            if (unlockToken == null || unlockToken.isBlank()) {
                throw com.sba302.reminer.common.exception.AppException.unauthorized("Unlock token is required in header X-Unlock-Token.");
            }
            tokenService.validateUnlockToken(userId, unlockToken);
        }

        Page<UnsentMessageResponse> result = unsentService.list(
                userId, status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    /**
     * Tạo unsent message cho user
     */
    @PostMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Create unsent message for specific user (ADMIN or own profile)")
    public ApiResponse<UnsentMessageResponse> createForUser(
            @PathVariable Long userId,
            @Valid @RequestBody CreateUnsentMessageRequest request,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "CREATE");
        return ApiResponse.created(unsentService.create(userId, request));
    }

    /**
     * Release message của user
     */
    @PostMapping("/user/{userId}/{id}/release")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Release message of specific user (ADMIN or own profile)")
    public ApiResponse<UnsentMessageResponse> releaseForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "RELEASE");
        return ApiResponse.ok(unsentService.release(userId, id));
    }

    /**
     * Xóa message của user
     */
    @DeleteMapping("/user/{userId}/{id}")
    @PreAuthorize("hasRole('ADMIN') or (#userId != null and authentication.principal.toString() == #userId.toString())")
    @Operation(summary = "Delete message of specific user (ADMIN or own profile)")
    public void deleteForUser(
            @PathVariable Long userId,
            @PathVariable Long id,
            Authentication authentication) {
        logAccess((CustomUserPrincipal) authentication.getPrincipal(), userId, "DELETE");
        unsentService.delete(userId, id);
    }

    /**
     * Helper method để log access
     */
    private void logAccess(CustomUserPrincipal principal, Long targetUserId, String action) {
        if (principal.getUserId().equals(targetUserId)) {
            log.info("User {} accessed own unsent messages [{}]", principal.getEmail(), action);
        } else if ("ADMIN".equals(principal.getRoleName())) {
            log.warn("ADMIN {} accessed user {} unsent messages [{}]", principal.getEmail(), targetUserId, action);
        }
    }
}

