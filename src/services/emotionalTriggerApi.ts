import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

// ─── Types ───────────────────────────────────────────────────
export interface TriggerSessionResponse {
  id: number;
  status: "RUNNING" | "COMPLETED" | "CANCELLED" | "REDIRECTED_TO_UNSENT";
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
}

// ─── API calls ───────────────────────────────────────────────
export const emotionalTriggerApi = {
  startSession: () =>
    apiFetch<ApiResponse<TriggerSessionResponse>>(
      "/api/v1/emotional-trigger/sessions",
      { method: "POST" }
    ),

  cancelSession: (id: number) =>
    apiFetch<ApiResponse<TriggerSessionResponse>>(
      `/api/v1/emotional-trigger/sessions/${id}/cancel`,
      { method: "POST" }
    ),

  completeSession: (id: number) =>
    apiFetch<ApiResponse<TriggerSessionResponse>>(
      `/api/v1/emotional-trigger/sessions/${id}/complete`,
      { method: "POST" }
    ),

  redirectToUnsent: (id: number) =>
    apiFetch<ApiResponse<TriggerSessionResponse>>(
      `/api/v1/emotional-trigger/sessions/${id}/redirect-to-unsent`,
      { method: "POST" }
    ),
};
