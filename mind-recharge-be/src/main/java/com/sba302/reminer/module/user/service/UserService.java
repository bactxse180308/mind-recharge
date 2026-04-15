package com.sba302.reminer.module.user.service;

import com.sba302.reminer.module.user.dto.request.AdminCreateUserRequest;
import com.sba302.reminer.module.user.dto.request.UpdateProfileRequest;
import com.sba302.reminer.module.user.dto.response.UserResponse;

public interface UserService {

    UserResponse getMe(Long userId);

    UserResponse updateMe(Long userId, UpdateProfileRequest request);

    UserResponse createUser(AdminCreateUserRequest request);
}
