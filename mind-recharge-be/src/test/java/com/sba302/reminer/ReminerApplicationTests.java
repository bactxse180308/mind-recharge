package com.sba302.reminer;

import com.sba302.reminer.common.config.CustomAccessDeniedHandler;
import com.sba302.reminer.common.config.CustomAuthenticationEntryPoint;
import com.sba302.reminer.common.config.SecurityConfig;
import com.sba302.reminer.common.controller.HealthController;
import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.common.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ReminerApplicationTests {

    private final HealthController healthController = new HealthController();

    @Test
    void rootEndpointReturnsUpStatus() {
        ApiResponse<Map<String, String>> response = healthController.root();

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).containsEntry("service", "reminer");
        assertThat(response.getData()).containsEntry("status", "UP");
    }

    @Test
    void healthEndpointReturnsUpStatus() {
        ApiResponse<Map<String, String>> response = healthController.health();

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getData()).containsEntry("service", "reminer");
        assertThat(response.getData()).containsEntry("status", "UP");
    }

    @Test
    void corsConfigurationAcceptsConfiguredOriginsAndOptionsMethod() {
        SecurityConfig securityConfig = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                mock(UserDetailsService.class),
                new CustomAuthenticationEntryPoint(),
                new CustomAccessDeniedHandler()
        );
        ReflectionTestUtils.setField(
                securityConfig,
                "allowedOrigins",
                "http://localhost:3000, https://app.example.com"
        );

        CorsConfiguration corsConfiguration = securityConfig.corsConfigurationSource()
                .getCorsConfiguration(new MockHttpServletRequest("OPTIONS", "/api/v1/health"));

        assertThat(corsConfiguration).isNotNull();
        assertThat(corsConfiguration.getAllowedOrigins())
                .containsExactly(
                        "http://localhost:3000",
                        "https://app.example.com",
                        "https://mind-recharge.vercel.app"
                );
        assertThat(corsConfiguration.getAllowedMethods()).contains("OPTIONS");
        assertThat(corsConfiguration.getAllowCredentials()).isTrue();
    }
}
