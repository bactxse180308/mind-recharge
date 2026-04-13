import { apiFetch } from "@/lib/apiClient";

// ─── Types ───────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  timezone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: number;
  email: string;
  displayName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: unknown;
  timestamp: string;
}

// ─── API calls ───────────────────────────────────────────────
export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<ApiResponse<AuthResponse>>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterRequest) =>
    apiFetch<ApiResponse<AuthResponse>>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () =>
    apiFetch<ApiResponse<void>>("/api/v1/auth/logout", {
      method: "POST",
    }),

  refresh: (refreshToken: string) =>
    apiFetch<ApiResponse<AuthResponse>>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};
