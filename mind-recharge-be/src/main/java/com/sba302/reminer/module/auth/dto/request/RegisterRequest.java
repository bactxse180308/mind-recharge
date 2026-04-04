package com.sba302.reminer.module.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Display name is required")
    @Size(min = 1, max = 100, message = "Display name must be 1–100 characters")
    private String displayName;

    /** IANA timezone, e.g. "Asia/Ho_Chi_Minh". Defaults to "UTC" if omitted. */
    private String timezone;
}
