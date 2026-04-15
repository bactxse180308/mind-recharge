package com.sba302.reminer.module.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CallSignalRequest {

    @NotNull
    private Long conversationId;

    @NotBlank
    @Size(max = 64)
    private String callId;

    @NotBlank
    @Pattern(regexp = "call\\.(invite|accept|reject|offer|answer|ice-candidate|end)")
    private String signalType;

    @Size(max = 32768)
    private String sdp;

    @Size(max = 8192)
    private String candidate;

    @Size(max = 255)
    private String sdpMid;

    private Integer sdpMLineIndex;

    @Size(max = 64)
    private String reason;
}
