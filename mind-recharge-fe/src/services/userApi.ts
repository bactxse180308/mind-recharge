import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

export interface UserResponse {
  id: number;
  email: string;
  displayName: string;
  timezone: string;
  locale: string;
  avatarUrl?: string;
  avatarKey?: string;
  hasSecurityPassword?: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  timezone?: string;
  locale?: string;
  avatarUrl?: string;
  avatarKey?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export const userApi = {
  getMe: () => apiFetch<ApiResponse<UserResponse>>("/api/v1/users/me"),

  updateMe: (body: UpdateProfileRequest) =>
    apiFetch<ApiResponse<UserResponse>>("/api/v1/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  changePassword: (userId: number, body: ChangePasswordRequest) =>
    apiFetch<ApiResponse<unknown>>(`/api/v1/users/${userId}/change-password`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  setupSecurityPassword: (securityPassword: string) =>
    apiFetch<ApiResponse<unknown>>("/api/v1/users/security-password", {
      method: "POST",
      body: JSON.stringify({ securityPassword }),
    }),

  changeSecurityPassword: (oldPassword: string, newPassword: string) =>
    apiFetch<ApiResponse<unknown>>("/api/v1/users/security-password", {
      method: "PUT",
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};
