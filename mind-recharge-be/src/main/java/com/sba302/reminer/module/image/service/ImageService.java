package com.sba302.reminer.module.image.service;

import com.sba302.reminer.module.image.dto.ImageUploadResponse;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

public interface ImageService {

    ImageUploadResponse uploadProductImage(MultipartFile file);

    void deleteImage(String key);

    ResponseBytes<GetObjectResponse> getImage(String key);
}
