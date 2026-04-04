package com.sba302.reminer.module.unsent.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUnsentMessageRequest {

    @NotBlank(message = "Content is required")
    private String content;
}
