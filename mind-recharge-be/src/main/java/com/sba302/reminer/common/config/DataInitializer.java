package com.sba302.reminer.common.config;

import com.sba302.reminer.common.enums.UserStatus;
import com.sba302.reminer.module.user.entity.Role;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.RoleRepository;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Data Initializer - Khởi tạo dữ liệu ban đầu khi ứng dụng chạy
 * - Tạo các roles: ADMIN, USER
 * - Tạo tài khoản admin mặc định
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminConfigProperties adminConfig;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("========== Starting Data Initialization ==========");

        // 1. Khởi tạo Roles
        initializeRoles();

        // 2. Khởi tạo Admin Account
        initializeAdminAccount();

        log.info("========== Data Initialization Completed ==========");
    }

    /**
     * Khởi tạo các roles: ADMIN, USER
     */
    private void initializeRoles() {
        log.info("Initializing roles...");

        createRoleIfNotExists("ADMIN", "Administrator with full system access");
        createRoleIfNotExists("USER", "Regular user account");

        log.info("Roles initialization completed");
    }

    /**
     * Tạo role nếu chưa tồn tại
     */
    private void createRoleIfNotExists(String roleName, String description) {
        if (!roleRepository.existsByRoleName(roleName)) {
            Role role = Role.builder()
                    .roleName(roleName)
                    .description(description)
                    .isActive(true)
                    .build();
            roleRepository.save(role);
            log.info("✓ Created role: {}", roleName);
        } else {
            log.info("✓ Role already exists: {}", roleName);
        }
    }

    /**
     * Khởi tạo tài khoản admin mặc định
     * Thông tin được đọc từ application.yml
     */
    private void initializeAdminAccount() {
        log.info("Initializing admin account...");

        String adminEmail = adminConfig.getEmail();
        String adminPassword = adminConfig.getPassword();

        // Kiểm tra xem admin đã tồn tại chưa
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("✓ Admin account already exists: {}", adminEmail);
            return;
        }

        // Tìm role ADMIN
        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new RuntimeException("ADMIN role not found. Please initialize roles first."));

        // Tạo admin account
        User admin = User.builder()
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .displayName(adminConfig.getFullName())
                .timezone("Asia/Ho_Chi_Minh")
                .locale("vi")
                .status(UserStatus.ACTIVE)
                .role(adminRole)
                .build();

        userRepository.save(admin);

        log.info("✓ Admin account created successfully");
        log.info("  Email: {}", adminEmail);
        log.info("  Password: {}", adminPassword);
        log.info("  ⚠️  IMPORTANT: Please change the default password after first login!");
    }
}

