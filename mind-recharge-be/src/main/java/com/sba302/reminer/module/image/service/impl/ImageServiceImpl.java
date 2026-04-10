package com.sba302.reminer.module.image.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.common.exception.BadRequestException;
import com.sba302.reminer.module.image.dto.ImageUploadResponse;
import com.sba302.reminer.module.image.service.ImageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class ImageServiceImpl implements ImageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private final S3Client s3Client;
    private final String bucketName;
    private final String publicUrl;
    private final long maxFileSize;
    private final String appBaseUrl;

    public ImageServiceImpl(
            S3Client s3Client,
            @Value("${r2.bucket-name}") String bucketName,
            @Value("${r2.public-url}") String publicUrl,
            @Value("${app.upload.image.max-file-size-bytes:5242880}") long maxFileSize,
            @Value("${app.base-url:http://localhost:8080}") String appBaseUrl) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
        this.publicUrl = publicUrl;
        this.maxFileSize = maxFileSize;
        this.appBaseUrl = appBaseUrl;
    }

    @Override
    public ImageUploadResponse uploadProductImage(MultipartFile file) {
        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String fileName = UUID.randomUUID() + "." + extension;
        String key = "products/" + fileName;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(file.getBytes()));
        } catch (IOException ex) {
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "FILE_READ_ERROR", "Cannot read uploaded file");
        } catch (S3Exception ex) {
            log.error("R2 upload failed: statusCode={} message={}",
                    ex.statusCode(), ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorMessage() : ex.getMessage());
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "R2_UPLOAD_FAILED", "Upload image to Cloudflare R2 failed");
        }

        String imageUrl = buildViewUrl(key);
        log.info("Uploaded image to R2: key={} size={}", key, file.getSize());

        return ImageUploadResponse.builder()
                .success(true)
                .message("Upload image successfully")
                .fileName(fileName)
                .key(key)
                .imageUrl(imageUrl)
                .build();
    }

    @Override
    public void deleteImage(String key) {
        validateDeleteKey(key);
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            log.info("Deleted image from R2: key={}", key);
        } catch (S3Exception ex) {
            log.error("R2 delete failed: statusCode={} message={}",
                    ex.statusCode(), ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorMessage() : ex.getMessage());
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "R2_DELETE_FAILED", "Delete image from Cloudflare R2 failed");
        }
    }

    @Override
    public ResponseBytes<GetObjectResponse> getImage(String key) {
        validateDeleteKey(key);
        try {
            return s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                throw AppException.notFound("Image not found");
            }
            log.error("R2 get object failed: statusCode={} message={}",
                    ex.statusCode(), ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorMessage() : ex.getMessage());
            throw new AppException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "R2_GET_OBJECT_FAILED", "Get image from Cloudflare R2 failed");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("File size exceeds maximum allowed size of " + maxFileSize + " bytes");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Only jpg, jpeg, png, webp files are allowed");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType) || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Invalid image content type");
        }
    }

    private String getExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || !fileName.contains(".")) {
            throw new BadRequestException("Invalid file name");
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private void validateDeleteKey(String key) {
        if (!StringUtils.hasText(key)) {
            throw new BadRequestException("Image key is required");
        }
        if (key.contains("..") || key.startsWith("/") || !key.startsWith("products/")) {
            throw new BadRequestException("Invalid image key");
        }
    }

    private String buildPublicUrl(String key) {
        return publicUrl.endsWith("/") ? publicUrl + key : publicUrl + "/" + key;
    }

    private String buildViewUrl(String key) {
        String baseUrl = appBaseUrl.endsWith("/") ? appBaseUrl.substring(0, appBaseUrl.length() - 1) : appBaseUrl;
        return baseUrl + "/api/images/view?key=" + key;
    }
}
