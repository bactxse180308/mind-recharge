import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { ApiResponseList } from "./homeApi";

export interface UnsentMessageResponse {
  id: number;
  content?: string;
  imageUrl?: string;
  imageKey?: string;
  status: "ACTIVE" | "RELEASED" | "DELETED";
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnsentMessageStatus = "ACTIVE" | "RELEASED" | "DELETED";

export const unsentMessageApi = {
  list: (
    unlockToken: string,
    status: UnsentMessageStatus = "ACTIVE",
    page = 0,
    size = 20
  ) => {
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

  create: (body: { content?: string; imageUrl?: string; imageKey?: string }) =>
    apiFetch<ApiResponse<UnsentMessageResponse>>("/api/v1/unsent-messages", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  release: (id: number) =>
    apiFetch<ApiResponse<UnsentMessageResponse>>(
      `/api/v1/unsent-messages/${id}/release`,
      { method: "POST" }
    ),

  delete: (id: number) =>
    apiFetch<void>(`/api/v1/unsent-messages/${id}`, { method: "DELETE" }),
};
