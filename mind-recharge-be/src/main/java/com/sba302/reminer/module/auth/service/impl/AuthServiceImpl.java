package com.sba302.reminer.module.auth.service.impl;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.common.security.JwtTokenProvider;
import com.sba302.reminer.module.auth.dto.request.LoginRequest;
import com.sba302.reminer.module.auth.dto.request.RefreshTokenRequest;
import com.sba302.reminer.module.auth.dto.request.RegisterRequest;
import com.sba302.reminer.module.auth.dto.response.AuthResponse;
import com.sba302.reminer.module.auth.entity.RefreshToken;
import com.sba302.reminer.module.auth.repository.RefreshTokenRepository;
import com.sba302.reminer.module.auth.service.AuthService;
import com.sba302.reminer.module.user.entity.Role;
import com.sba302.reminer.module.user.entity.User;
import com.sba302.reminer.module.user.repository.RoleRepository;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${app.jwt.refresh-token-expiry-days}")
    private int refreshTokenExpiryDays;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Register attempt for email=[REDACTED]");

        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Email is already registered");
        }

        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> AppException.notFound("Default role USER not found in database"));

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .timezone(StringUtils.hasText(request.getTimezone()) ? request.getTimezone() : "UTC")
                .role(userRole)
                .build();

        userRepository.save(user);
        log.info("New user registered: id={}", user.getId());

        return buildAuthResponse(user, null);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email=[REDACTED]");

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw AppException.unauthorized("Invalid email or password");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String rawRefreshToken = UUID.randomUUID().toString();
        saveRefreshToken(user, rawRefreshToken, request.getDeviceName());

        log.info("User logged in: id={}", user.getId());
        return buildAuthResponse(user, rawRefreshToken);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String tokenHash = hash(request.getRefreshToken());

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> AppException.unauthorized("Invalid or expired refresh token"));

        if (!stored.isValid()) {
            throw AppException.unauthorized("Refresh token has been revoked or expired");
        }

        // Token rotation — revoke old, issue new
        stored.setRevokedAt(Instant.now());
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        String newRawToken = UUID.randomUUID().toString();
        saveRefreshToken(user, newRawToken, stored.getDeviceName());

        log.info("Token refreshed for userId={}", user.getId());
        return buildAuthResponse(user, newRawToken);
    }

    @Override
    @Transactional
    public void logout(Long userId) {
        Instant now = Instant.now();
        // Fetch all active tokens for this user and revoke them individually via repository save
        var activeTokens = refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId);
        activeTokens.forEach(token -> token.setRevokedAt(now));
        refreshTokenRepository.saveAll(activeTokens);
        log.info("Logout userId={} revoked={} tokens", userId, activeTokens.size());
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void saveRefreshToken(User user, String rawToken, String deviceName) {
        Instant expiry = Instant.now().plus(refreshTokenExpiryDays, ChronoUnit.DAYS);
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(rawToken))
                .expiresAt(expiry)
                .deviceName(deviceName)
                .build();
        refreshTokenRepository.save(token);
    }

    private AuthResponse buildAuthResponse(User user, String rawRefreshToken) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiryMs / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .build();
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
