package com.sba302.reminer.module.unsent.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnlockTokenResponse {
    private String unlockToken;
    private long expiresIn;
}
