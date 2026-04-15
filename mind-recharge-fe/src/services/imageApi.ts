import { API_BASE_URL } from "@/lib/config";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

export interface ImageUploadPayload {
  success: boolean;
  message: string;
  fileName: string;
  key: string;
  imageUrl: string;
}

function extractKeyFromUrl(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const queryKey = parsed.searchParams.get("key");
    if (queryKey) return queryKey;

    const marker = "/products/";
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return parsed.pathname.slice(markerIndex + 1);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export const imageApi = {
  buildViewUrl: (key?: string, fallbackUrl?: string) => {
    const resolvedKey = key || extractKeyFromUrl(fallbackUrl);
    if (resolvedKey) {
      return `${API_BASE_URL}/api/images/view?key=${encodeURIComponent(resolvedKey)}`;
    }
    return fallbackUrl;
  },

  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<ApiResponse<ImageUploadPayload>>("/api/images/upload", {
      method: "POST",
      body: formData,
    });
  },

  delete: (key: string) =>
    apiFetch<ApiResponse<null>>(`/api/images?key=${encodeURIComponent(key)}`, {
      method: "DELETE",
    }),
};
