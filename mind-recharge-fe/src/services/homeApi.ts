import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

// ─── Types ───────────────────────────────────────────────────
export interface HomeSummaryResponse {
  hasCheckinToday: boolean;
  tasksDoneToday: number;
  totalTasksToday: number;
  noContactStreakDays: number;
}

export interface CheckinRequest {
  moodLevel: "BAD" | "NEUTRAL" | "BETTER";
  note?: string;
}

export interface CheckinResponse {
  id: number;
  checkinDate: string;
  moodLevel: "BAD" | "NEUTRAL" | "BETTER";
  responseKey: string;
  responseText: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponseList<T> {
  success: boolean;
  message: string;
  data: T[];
  meta?: unknown;
  timestamp: string;
}

// ─── Home API ────────────────────────────────────────────────
export const homeApi = {
  getSummary: () =>
    apiFetch<ApiResponse<HomeSummaryResponse>>("/api/v1/home/summary"),
};

// ─── Check-in API ────────────────────────────────────────────
export const checkinApi = {
  getToday: () =>
    apiFetch<ApiResponse<CheckinResponse>>("/api/v1/checkins/today"),

  upsertToday: (body: CheckinRequest) =>
    apiFetch<ApiResponse<CheckinResponse>>("/api/v1/checkins/today", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getHistory: (from: string, to: string) =>
    apiFetch<ApiResponseList<CheckinResponse>>(
      `/api/v1/checkins/history?from=${from}&to=${to}`
    ),
};
