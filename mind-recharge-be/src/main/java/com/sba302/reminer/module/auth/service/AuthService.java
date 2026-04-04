package com.sba302.reminer.module.auth.service;

import com.sba302.reminer.module.auth.dto.request.LoginRequest;
import com.sba302.reminer.module.auth.dto.request.RefreshTokenRequest;
import com.sba302.reminer.module.auth.dto.request.RegisterRequest;
import com.sba302.reminer.module.auth.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refresh(RefreshTokenRequest request);

    void logout(Long userId);
}
