package com.sba302.reminer.common.controller;

import com.sba302.reminer.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/")
    public ApiResponse<Map<String, String>> root() {
        return ApiResponse.ok(Map.of(
                "service", "reminer",
                "status", "UP"
        ), "Service is running");
    }

    @GetMapping("/api/v1/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.ok(Map.of(
                "service", "reminer",
                "status", "UP"
        ), "Health check OK");
    }
}
