import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  bootstrapApi,
  type BootstrapResponse,
} from "@/services/bootstrapApi";
import { useAuth } from "./AuthContext";

// ─── Context type ────────────────────────────────────────────
interface BootstrapContextValue {
  bootstrap: BootstrapResponse | null;
  isLoading: boolean;
  /** Pick a random quote from bootstrap, fallback to hardcoded one */
  randomQuote: () => string;
  /** Get response text for a mood level */
  moodResponse: (moodLevel: string) => string;
  /** Get milestone message for given day count */
  milestoneMessage: (days: number) => string | undefined;
}

const FALLBACK_QUOTES = [
  "Bạn nhớ họ, nhưng bạn cũng nhớ mình đã từng mệt như thế nào",
  "Mỗi ngày bạn cố gắng là một ngày đáng trân trọng.",
  "Chữa lành không phải là quên đi, mà là học cách sống tiếp.",
];

const FALLBACK_MOOD: Record<string, string> = {
  BAD: "Không sao đâu, hôm nay khó khăn thì ngày mai sẽ nhẹ hơn.",
  NEUTRAL: "Bình thường cũng là ổn. Từng bước nhỏ, bạn đang tiến về phía trước.",
  BETTER: "Tuyệt vời! Bạn đang ổn hơn bạn nghĩ. Tiếp tục nhé 💜",
};

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────
export const BootstrapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setBootstrap(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    bootstrapApi
      .get()
      .then((res) => {
        if (!cancelled) setBootstrap(res.data);
      })
      .catch(() => {
        // Silently fallback — app still works without bootstrap
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const randomQuote = useCallback((): string => {
    const quotes = bootstrap?.quotes?.length ? bootstrap.quotes : FALLBACK_QUOTES;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, [bootstrap]);

  const moodResponse = useCallback(
    (moodLevel: string): string => {
      return (
        bootstrap?.moodResponses?.[moodLevel] ??
        FALLBACK_MOOD[moodLevel] ??
        "Cảm ơn bạn đã chia sẻ 💜"
      );
    },
    [bootstrap]
  );

  const milestoneMessage = useCallback(
    (days: number): string | undefined => {
      return bootstrap?.milestoneMessages?.[String(days)];
    },
    [bootstrap]
  );

  return (
    <BootstrapContext.Provider
      value={{
        bootstrap,
        isLoading,
        randomQuote,
        moodResponse,
        milestoneMessage,
      }}
    >
      {children}
    </BootstrapContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────
export const useBootstrap = () => {
  const ctx = useContext(BootstrapContext);
  if (!ctx) throw new Error("useBootstrap must be used within BootstrapProvider");
  return ctx;
};
