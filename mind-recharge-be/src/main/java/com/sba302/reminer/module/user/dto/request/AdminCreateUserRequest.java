package com.sba302.reminer.module.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateUserRequest {

    @Email(message = "Email is invalid")
    @NotBlank(message = "Email is required")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 255, message = "Password must be 8-255 characters")
    private String password;

    @NotBlank(message = "Display name is required")
    @Size(min = 1, max = 100, message = "Display name must be 1-100 characters")
    private String displayName;

    @Size(max = 60, message = "Timezone must not exceed 60 characters")
    private String timezone;

    @Size(max = 10, message = "Locale must not exceed 10 characters")
    private String locale;

    @Size(max = 50, message = "Role name must not exceed 50 characters")
    private String roleName;
}
