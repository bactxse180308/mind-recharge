import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { ApiResponseList } from "./homeApi";

// ─── Types ───────────────────────────────────────────────────
export interface DailyTaskResponse {
  templateId: number;
  code: string;
  title: string;
  emoji: string;
  sortOrder: number;
  taskDate: string;
  doneAt?: string;
  done: boolean;
}

export interface UpdateTaskStatusRequest {
  isDone: boolean;
}

// ─── API calls ───────────────────────────────────────────────
export const dailyTaskApi = {
  getToday: () =>
    apiFetch<ApiResponseList<DailyTaskResponse>>("/api/v1/daily-tasks/today"),

  getHistory: (from: string, to: string) =>
    apiFetch<ApiResponseList<DailyTaskResponse>>(
      `/api/v1/daily-tasks/history?from=${from}&to=${to}`
    ),

  updateStatus: (taskCode: string, isDone: boolean) =>
    apiFetch<ApiResponse<DailyTaskResponse>>(
      `/api/v1/daily-tasks/${taskCode}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ isDone } satisfies UpdateTaskStatusRequest),
      }
    ),
};
