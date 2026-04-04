package com.sba302.reminer.module.user.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.user.dto.request.UpdateProfileRequest;
import com.sba302.reminer.module.user.dto.response.UserResponse;
import com.sba302.reminer.module.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ApiResponse<UserResponse> getMe() {
        return ApiResponse.ok(userService.getMe(SecurityUtils.getCurrentUserId()));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current user profile")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateMe(SecurityUtils.getCurrentUserId(), request));
    }
}
