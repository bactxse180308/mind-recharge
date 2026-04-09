import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { ApiResponseList } from "./homeApi";

// ─── Types ───────────────────────────────────────────────────
export interface UnsentMessageResponse {
  id: number;
  content?: string; // may be absent for old messages before fix
  status: "ACTIVE" | "RELEASED" | "DELETED";
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnsentMessageStatus = "ACTIVE" | "RELEASED" | "DELETED";

// ─── API calls ───────────────────────────────────────────────
export const unsentMessageApi = {
  list: (unlockToken: string, status: UnsentMessageStatus = "ACTIVE", page = 0, size = 20) => {
    const headers = unlockToken ? { "X-Unlock-Token": unlockToken } : undefined;
    return apiFetch<ApiResponseList<UnsentMessageResponse>>(
      `/api/v1/unsent-messages?status=${status}&page=${page}&size=${size}`,
      { headers }
    );
  },

  unlock: (securityPassword: string) => 
    apiFetch<ApiResponse<{ unlockToken: string; expiresIn: number }>>(
      "/api/v1/unsent-messages/unlock",
      {
        method: "POST",
        body: JSON.stringify({ securityPassword }),
      }
    ),

  create: (content: string) =>
    apiFetch<ApiResponse<UnsentMessageResponse>>("/api/v1/unsent-messages", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  release: (id: number) =>
    apiFetch<ApiResponse<UnsentMessageResponse>>(
      `/api/v1/unsent-messages/${id}/release`,
      { method: "POST" }
    ),

  delete: (id: number) =>
    apiFetch<void>(`/api/v1/unsent-messages/${id}`, { method: "DELETE" }),
};
