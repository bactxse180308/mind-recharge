import { API_BASE_URL as BASE_URL } from "./config";

// ────────────────────────────────────────────────────────────
// Token helpers
// ────────────────────────────────────────────────────────────
export const TokenStorage = {
  getAccess: () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  set: (access: string, refresh: string) => {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
  },
  clear: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// ────────────────────────────────────────────────────────────
// Core fetch wrapper
// ────────────────────────────────────────────────────────────
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string> {
  const refreshToken = TokenStorage.getRefresh();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    TokenStorage.clear();
    window.location.href = "/login";
    throw new Error("Refresh failed");
  }

  const json = await res.json();
  const { accessToken, refreshToken: newRefresh } = json.data;
  TokenStorage.set(accessToken, newRefresh);
  return accessToken;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = TokenStorage.getAccess();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 401 → try refresh
  if (res.status === 401 && TokenStorage.getRefresh()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        pendingQueue.forEach((cb) => cb(newToken));
        pendingQueue = [];

        // Retry original request
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers,
        });
        if (!retryRes.ok) throw await retryRes.json();
        if (retryRes.status === 204) return undefined as T;
        return retryRes.json();
      } catch (err) {
        isRefreshing = false;
        pendingQueue = [];
        throw err;
      }
    } else {
      // Wait for refresh
      return new Promise<T>((resolve, reject) => {
        pendingQueue.push(async (newToken) => {
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
          });
          if (!retryRes.ok) {
            reject(await retryRes.json());
          } else {
            resolve(retryRes.json());
          }
        });
      });
    }
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: res.statusText }));
    throw errBody;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
