package com.sba302.reminer.module.unsent.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUnsentMessageRequest {

    private String content;

    private String imageUrl;

    private String imageKey;
}
