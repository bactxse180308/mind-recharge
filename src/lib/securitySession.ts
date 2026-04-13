const KEY = "mr_sec_session";

interface SessionData {
  token: string;
  expiresAt: number;
}

export const SecuritySessionManager = {
  set: (token: string, expiresInSecs: number = 300) => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        token,
        expiresAt: Date.now() + expiresInSecs * 1000,
      })
    );
  },
  get: (): string | null => {
    try {
      const dataStr = localStorage.getItem(KEY);
      if (!dataStr) return null;
      
      const data: SessionData = JSON.parse(dataStr);
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(KEY);
        return null;
      }
      
      // Update last active if needed, or keep strictly absolute expiration.
      // We keep strictly absolute (5 mins max) like banking apps.
      return data.token;
    } catch {
      return null;
    }
  },
  clear: () => localStorage.removeItem(KEY),
};
