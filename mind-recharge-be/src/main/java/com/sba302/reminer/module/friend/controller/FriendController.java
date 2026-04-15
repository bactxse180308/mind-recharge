package com.sba302.reminer.module.friend.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.response.PageMeta;
import com.sba302.reminer.common.util.SecurityUtils;
import com.sba302.reminer.module.friend.dto.request.SendFriendRequestRequest;
import com.sba302.reminer.module.friend.dto.response.FriendRequestResponse;
import com.sba302.reminer.module.friend.dto.response.FriendSearchResponse;
import com.sba302.reminer.module.friend.dto.response.FriendshipResponse;
import com.sba302.reminer.module.friend.service.FriendService;
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
@RequestMapping("/api/v1/friends")
@RequiredArgsConstructor
@Tag(name = "Friends", description = "Friend requests, friend list, and user search")
@SecurityRequirement(name = "bearerAuth")
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send a friend request")
    public ApiResponse<FriendRequestResponse> sendRequest(@Valid @RequestBody SendFriendRequestRequest request) {
        return ApiResponse.created(friendService.sendRequest(SecurityUtils.getCurrentUserId(), request));
    }

    @PostMapping("/requests/{requestId}/accept")
    @Operation(summary = "Accept a friend request")
    public ApiResponse<FriendRequestResponse> acceptRequest(@PathVariable Long requestId) {
        return ApiResponse.ok(friendService.acceptRequest(SecurityUtils.getCurrentUserId(), requestId));
    }

    @PostMapping("/requests/{requestId}/reject")
    @Operation(summary = "Reject a friend request")
    public ApiResponse<FriendRequestResponse> rejectRequest(@PathVariable Long requestId) {
        return ApiResponse.ok(friendService.rejectRequest(SecurityUtils.getCurrentUserId(), requestId));
    }

    @PostMapping("/requests/{requestId}/cancel")
    @Operation(summary = "Cancel a sent friend request")
    public ApiResponse<FriendRequestResponse> cancelRequest(@PathVariable Long requestId) {
        return ApiResponse.ok(friendService.cancelRequest(SecurityUtils.getCurrentUserId(), requestId));
    }

    @GetMapping("/requests/incoming")
    @Operation(summary = "List incoming pending friend requests")
    public ApiResponse<List<FriendRequestResponse>> incomingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FriendRequestResponse> result = friendService.listIncomingRequests(
                SecurityUtils.getCurrentUserId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping("/requests/outgoing")
    @Operation(summary = "List outgoing pending friend requests")
    public ApiResponse<List<FriendRequestResponse>> outgoingRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FriendRequestResponse> result = friendService.listOutgoingRequests(
                SecurityUtils.getCurrentUserId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping
    @Operation(summary = "List current friends")
    public ApiResponse<List<FriendshipResponse>> listFriends(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FriendshipResponse> result = friendService.listFriends(
                SecurityUtils.getCurrentUserId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users for adding friends")
    public ApiResponse<List<FriendSearchResponse>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<FriendSearchResponse> result = friendService.searchUsers(
                SecurityUtils.getCurrentUserId(),
                q,
                PageRequest.of(page, size, Sort.by("displayName").ascending())
        );
        return ApiResponse.ok(result.getContent(), PageMeta.of(result));
    }
}
