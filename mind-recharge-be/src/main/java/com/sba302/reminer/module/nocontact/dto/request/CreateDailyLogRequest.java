package com.sba302.reminer.module.nocontact.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateDailyLogRequest {

    @NotBlank
    private String content;
}
