import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { ApiResponseList } from "./homeApi";

// ─── Types ───────────────────────────────────────────────────
export type JournalMoodCode = "SAD" | "NEUTRAL" | "BETTER" | "CALM" | "LOVE";

export interface JournalResponse {
  id: number;
  moodCode: JournalMoodCode;
  content: string;
  entryAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalRequest {
  moodCode: JournalMoodCode;
  content?: string;
  entryAt?: string;
}

export interface UpdateJournalRequest {
  moodCode?: JournalMoodCode;
  content?: string;
}

// ─── API calls ───────────────────────────────────────────────
export const journalApi = {
  list: (page = 0, size = 20) =>
    apiFetch<ApiResponseList<JournalResponse>>(
      `/api/v1/journal?page=${page}&size=${size}`
    ),

  getById: (id: number) =>
    apiFetch<ApiResponse<JournalResponse>>(`/api/v1/journal/${id}`),

  create: (body: CreateJournalRequest) =>
    apiFetch<ApiResponse<JournalResponse>>("/api/v1/journal", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: UpdateJournalRequest) =>
    apiFetch<ApiResponse<JournalResponse>>(`/api/v1/journal/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/api/v1/journal/${id}`, { method: "DELETE" }),

  highlight: () =>
    apiFetch<ApiResponseList<JournalResponse>>("/api/v1/journal/highlight"),
};
