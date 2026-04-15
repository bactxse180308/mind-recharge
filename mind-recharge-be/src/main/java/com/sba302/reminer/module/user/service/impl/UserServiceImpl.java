package com.sba302.reminer.module.user.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.module.user.dto.request.AdminCreateUserRequest;
import com.sba302.reminer.module.user.dto.request.UpdateProfileRequest;
import com.sba302.reminer.module.user.dto.response.UserResponse;
import com.sba302.reminer.module.user.entity.Role;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.RoleRepository;
import com.sba302.reminer.module.user.repository.UserRepository;
import com.sba302.reminer.module.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse getMe(Long userId) {
        User user = findUser(userId);
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateMe(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (StringUtils.hasText(request.getDisplayName())) {
            user.setDisplayName(request.getDisplayName());
        }
        if (StringUtils.hasText(request.getTimezone())) {
            user.setTimezone(request.getTimezone());
        }
        if (StringUtils.hasText(request.getLocale())) {
            user.setLocale(request.getLocale());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getAvatarKey() != null) {
            user.setAvatarKey(request.getAvatarKey());
        }

        userRepository.save(user);
        log.info("Profile updated: userId={}", userId);
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(AdminCreateUserRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw AppException.conflict("Email is already registered");
        }

        String roleName = StringUtils.hasText(request.getRoleName())
                ? request.getRoleName().trim().toUpperCase()
                : "USER";
        Role role = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> AppException.notFound("Role " + roleName + " not found"));

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName().trim())
                .timezone(StringUtils.hasText(request.getTimezone()) ? request.getTimezone().trim() : "UTC")
                .locale(StringUtils.hasText(request.getLocale()) ? request.getLocale().trim() : "vi")
                .role(role)
                .build();

        userRepository.save(user);
        log.info("Admin created user: id={} role={}", user.getId(), roleName);
        return toResponse(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .timezone(user.getTimezone())
                .locale(user.getLocale())
                .avatarUrl(user.getAvatarUrl())
                .avatarKey(user.getAvatarKey())
                .hasSecurityPassword(user.getSecurityPasswordHash() != null && !user.getSecurityPasswordHash().isBlank())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
