import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authApi, type AuthResponse } from "@/services/authApi";
import { TokenStorage } from "@/lib/apiClient";

// ─── Context type ────────────────────────────────────────────
interface AuthUser {
  userId: number;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    timezone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = TokenStorage.getAccess();
    if (token) {
      // Try to decode user info from stored data (we store it separately)
      const storedUser = localStorage.getItem("authUser");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          TokenStorage.clear();
        }
      }
    }
    setIsLoading(false);
  }, []);

  const _applyAuth = useCallback((data: AuthResponse) => {
    TokenStorage.set(data.accessToken, data.refreshToken);
    const u: AuthUser = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
    };
    localStorage.setItem("authUser", JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      _applyAuth(res.data);
    },
    [_applyAuth]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      timezone?: string
    ) => {
      const res = await authApi.register({
        email,
        password,
        displayName,
        timezone,
      });
      _applyAuth(res.data);
    },
    [_applyAuth]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    } finally {
      TokenStorage.clear();
      localStorage.removeItem("authUser");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
