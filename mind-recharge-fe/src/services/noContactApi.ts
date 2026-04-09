import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { ApiResponseList } from "./homeApi";

// ─── Types ───────────────────────────────────────────────────
export interface NoContactJourneyResponse {
  id: number;
  status: "ACTIVE" | "RESET" | "COMPLETED";
  startedAt: string;
  endedAt?: string;
  resetReason?: string;
  streakDays: number;
  achievedMilestones: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ResetJourneyRequest {
  resetReason?: string;
}

// ─── API calls ───────────────────────────────────────────────
export const noContactApi = {
  start: () =>
    apiFetch<ApiResponse<NoContactJourneyResponse>>("/api/v1/no-contact/start", {
      method: "POST",
    }),

  getCurrent: () =>
    apiFetch<ApiResponse<NoContactJourneyResponse>>("/api/v1/no-contact/current"),

  reset: (body?: ResetJourneyRequest) =>
    apiFetch<ApiResponse<NoContactJourneyResponse>>("/api/v1/no-contact/reset", {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),

  history: (page = 0, size = 20) =>
    apiFetch<ApiResponseList<NoContactJourneyResponse>>(
      `/api/v1/no-contact/history?page=${page}&size=${size}`
    ),
};
