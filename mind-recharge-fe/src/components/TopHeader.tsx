import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createRealtimeClient } from "@/lib/chatRealtime";
import { imageApi } from "@/services/imageApi";
import { notificationApi, type NotificationRealtimeEvent } from "@/services/notificationApi";
import { userApi } from "@/services/userApi";

const HIDDEN_PATHS = ["/login", "/trigger"];

const TopHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: profileResponse } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => userApi.getMe(),
    enabled: isAuthenticated,
  });

  const { data: unreadCountResponse } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const client = createRealtimeClient();
    if (!client) return;

    client.onConnect = () => {
      client.subscribe("/user/queue/notifications", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as NotificationRealtimeEvent;
          qc.setQueryData(["notifications-unread-count"], {
            success: true,
            message: "OK",
            data: { unreadCount: payload.unreadCount },
            timestamp: new Date().toISOString(),
          });
        } catch {
          qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        }

        qc.invalidateQueries({ queryKey: ["notifications-list"] });
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [isAuthenticated, qc]);

  const profile = profileResponse?.data;
  const unreadCount = unreadCountResponse?.data?.unreadCount ?? 0;
  const avatarSrc = imageApi.buildViewUrl(profile?.avatarKey, profile?.avatarUrl);
  const avatarFallback = (profile?.displayName || profile?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;
  if (!isAuthenticated) return null;

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex justify-center fade-in-slow">
      <div className="flex w-full max-w-[480px] items-center justify-between bg-gradient-to-b from-background/80 to-transparent px-6 pb-4 pt-safe">
        <div className="pointer-events-auto mt-1 flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-primary/50 to-primary/10 p-[1px] shadow-[0_0_15px_rgba(167,139,250,0.15)]">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
            <img
              src="/logo.png"
              alt="Mind Recharge"
              className="relative h-full w-full rounded-[13px] object-cover"
            />
          </div>

          <div className="ml-1 flex items-center font-sans leading-none tracking-tighter">
            <span className="text-[25px] font-black text-foreground drop-shadow-sm">Mind</span>
            <span
              className="ml-[1px] bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-[25px] font-extrabold text-transparent"
              style={{ paddingBottom: "2px" }}
            >
              Recharge
            </span>
          </div>
        </div>

        <div className="pointer-events-auto mt-1 flex items-center gap-2">
          <Avatar className="h-10 w-10 border border-border/20 shadow-[0_0_16px_rgba(255,255,255,0.05)]">
            <AvatarImage
              src={avatarSrc}
              alt={profile?.displayName || profile?.email || "Avatar"}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/15 text-sm text-primary">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          <button
            onClick={() => navigate("/notifications")}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/5 bg-secondary/20 text-muted-foreground transition-all btn-press hover:bg-secondary/40 hover:text-foreground"
            aria-label="Thông báo"
          >
            <Bell size={22} strokeWidth={2.2} className="opacity-80" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-background/50 bg-rose-400 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white shadow-[0_0_6px_rgba(251,113,133,0.6)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
