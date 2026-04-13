import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

// ─── Types ───────────────────────────────────────────────────
export interface TaskTemplateItem {
  id: number;
  code: string;
  title: string;
  emoji: string;
}

export interface BootstrapResponse {
  moodOptions: string[];
  moodResponses: Record<string, string>;
  triggerReminders: string[];
  milestoneMessages: Record<string, string>;
  quotes: string[];
  journalMicrocopies: Record<string, string>;
  dailyFeedbacks: Record<string, string>;
  taskTemplates: TaskTemplateItem[];
}

// ─── API calls ───────────────────────────────────────────────
export const bootstrapApi = {
  get: () =>
    apiFetch<ApiResponse<BootstrapResponse>>("/api/v1/bootstrap"),
};
