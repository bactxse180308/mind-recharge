package com.sba302.reminer.module.image.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ImageUploadResponse {
    private boolean success;
    private String message;
    private String fileName;
    private String key;
    private String imageUrl;
}
