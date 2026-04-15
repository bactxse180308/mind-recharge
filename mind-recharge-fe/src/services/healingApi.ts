import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";
import type { HealingTimelineResponse } from "@/types/healing";

export const healingApi = {
  getTimeline: (days: number = 30) => {
    return apiFetch<ApiResponse<HealingTimelineResponse>>(`/api/v1/healing/timeline?days=${days}`, {
      method: "GET",
    });
  },
};
