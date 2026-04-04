package com.sba302.reminer.module.dailytask.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateTaskStatusRequest {

    @NotNull(message = "isDone is required")
    private Boolean isDone;
}
