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

export interface NoContactStatsResponse {
  longestStreakDays: number;
  totalResets: number;
}

export interface DailyLogResponse {
  id: number;
  logDate: string; // "YYYY-MM-DD"
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyLogRequest {
  content: string;
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

  getStats: () =>
    apiFetch<ApiResponse<NoContactStatsResponse>>("/api/v1/no-contact/stats"),

  upsertDailyLog: (body: CreateDailyLogRequest) =>
    apiFetch<ApiResponse<DailyLogResponse>>("/api/v1/no-contact/daily-logs", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getDailyLogs: (page = 0, size = 10) =>
    apiFetch<ApiResponseList<DailyLogResponse>>(
      `/api/v1/no-contact/daily-logs?page=${page}&size=${size}`
    ),
};
