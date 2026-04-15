package com.sba302.reminer.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình thông tin Admin mặc định từ application.yml
 */
@Component
@ConfigurationProperties(prefix = "app.admin")
@Getter
@Setter
public class AdminConfigProperties {
    private String email = "admin@mindrecharge.com";
    private String password = "Admin@123456";
    private String fullName = "System Administrator";
    private String phone = "0123456789";
    private String address = "System";
}

