package com.sba302.reminer.module.healing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimelineMilestone {
    private Integer day;
    private Boolean achieved;
}
