package com.sba302.reminer.module.image.controller;

import com.sba302.reminer.common.response.ApiResponse;
import com.sba302.reminer.module.image.dto.ImageUploadResponse;
import com.sba302.reminer.module.image.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@Slf4j
@RestController
@RequestMapping("/api/images")
@Tag(name = "Images", description = "Image upload APIs")
@SecurityRequirement(name = "bearerAuth")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload product image to Cloudflare R2")
    public ApiResponse<ImageUploadResponse> upload(@RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(imageService.uploadProductImage(file), "Upload image successfully");
    }

    @GetMapping("/view")
    @Operation(summary = "View image from Cloudflare R2 by key")
    public ResponseEntity<byte[]> view(@RequestParam("key") String key) {
        ResponseBytes<GetObjectResponse> objectBytes = imageService.getImage(key);
        String contentType = objectBytes.response().contentType();
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .body(objectBytes.asByteArray());
    }

    @DeleteMapping
    @Operation(summary = "Delete image from Cloudflare R2 by key")
    public ApiResponse<Void> delete(@RequestParam("key") String key) {
        imageService.deleteImage(key);
        return ApiResponse.ok(null, "Delete image successfully");
    }
}
