package com.sba302.reminer.module.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SecurityPasswordRequest {
    @NotBlank(message = "Security password is required")
    @Size(min = 4, max = 20, message = "Security password must be between 4 and 20 characters")
    private String securityPassword;
}
