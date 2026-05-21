package com.sba302.reminer.module.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SecurityPasswordRequest {
    @NotBlank(message = "Security password is required")
    @Pattern(regexp = "\\d{4}", message = "Security password must be exactly 4 digits")
    private String securityPassword;
}
