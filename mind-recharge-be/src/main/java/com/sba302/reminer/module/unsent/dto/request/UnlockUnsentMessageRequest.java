package com.sba302.reminer.module.unsent.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnlockUnsentMessageRequest {
    @NotBlank(message = "Security password is required")
    private String securityPassword;
}
