import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createRealtimeClient } from "@/lib/chatRealtime";
import { imageApi } from "@/services/imageApi";
import {
  notificationApi,
  type NotificationItem,
  type NotificationRealtimeEvent,
} from "@/services/notificationApi";

function getInitial(value?: string) {
  return (value || "U").trim().charAt(0).toUpperCase();
}

function formatDateTime(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getNotificationTypeMeta(type: NotificationItem["type"]) {
  switch (type) {
    case "CHAT_MESSAGE":
      return {
        label: "Tin nhắn",
        className: "border-primary/20 bg-primary/10 text-primary",
      };
    default:
      return {
        label: type,
        className: "border-border/20 bg-secondary/40 text-muted-foreground",
      };
  }
}

const Notifications = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationApi.listNotifications(),
  });

  const notifications = data?.data ?? [];

  useEffect(() => {
    const client = createRealtimeClient();
    if (!client) return;

    client.onConnect = () => {
      client.subscribe("/user/queue/notifications", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as NotificationRealtimeEvent;
          qc.invalidateQueries({ queryKey: ["notifications-list"] });
          qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });

          if (payload.notification?.conversationId) {
            qc.invalidateQueries({
              queryKey: ["chat-messages", payload.notification.conversationId],
            });
          }
        } catch {
          qc.invalidateQueries({ queryKey: ["notifications-list"] });
          qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        }
      });
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [qc]);

  const { mutate: markAsRead, isPending: isMarkingOne } = useMutation({
    mutationFn: (notificationId: number) => notificationApi.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });

      const selected = notifications.find((item) => item.id === notificationId);
      if (selected?.conversationId) {
        navigate(`/friends/chat/${selected.conversationId}`);
      }
    },
    onError: () => {
      toast.error("Không thể đánh dấu thông báo đã đọc");
    },
  });

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      toast.success("Đã đánh dấu tất cả là đã đọc.");
    },
    onError: () => {
      toast.error("Không thể đánh dấu tất cả đã đọc");
    },
  });

  const handleNotificationClick = (notification: NotificationItem) => {
    if (notification.isRead) {
      if (notification.conversationId) {
        navigate(`/friends/chat/${notification.conversationId}`);
      }
      return;
    }

    markAsRead(notification.id);
  };

  return (
    <div className="min-h-screen healing-gradient-bg px-5 pb-28 pt-20">
      <div className="mx-auto max-w-[480px] page-enter">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-muted-foreground transition-colors btn-press hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-light text-foreground">Thông báo</h1>
          </div>
          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll || notifications.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary/15 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/25 disabled:opacity-50"
          >
            {isMarkingAll ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Đọc hết
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center pt-10">
            <LoaderCircle size={20} className="animate-spin text-primary/70" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="healing-card flex flex-col items-center px-6 py-10 text-center">
            <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
              <Bell size={18} />
            </div>
            <p className="text-sm font-medium text-foreground">Chưa có thông báo</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Thông báo mới từ chat và các tính năng khác sẽ hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const avatarSrc = imageApi.buildViewUrl(
                notification.actor?.avatarKey,
                notification.actor?.avatarUrl
              );
              const typeMeta = getNotificationTypeMeta(notification.type);

              return (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  className={`healing-card cursor-pointer p-4 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30 ${
                    notification.isRead ? "opacity-75" : "border-primary/25 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="mt-0.5 h-11 w-11 border border-primary/20 bg-primary/10">
                      <AvatarImage src={avatarSrc} alt={notification.title} className="object-cover" />
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {getInitial(notification.actor?.displayName || notification.title)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${typeMeta.className}`}
                          >
                            {typeMeta.label}
                          </span>
                          <p
                            className={`mt-2 truncate text-sm ${
                              notification.isRead
                                ? "font-medium text-foreground/80"
                                : "font-semibold text-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p
                            className={`mt-1 truncate text-sm ${
                              notification.isRead
                                ? "text-muted-foreground/70"
                                : "font-medium text-foreground/90"
                            }`}
                          >
                            {notification.body}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]" />
                        )}
                      </div>

                      <p className="mt-2 text-[11px] text-muted-foreground/45">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isMarkingOne && (
          <div className="mt-4 flex justify-center">
            <LoaderCircle size={16} className="animate-spin text-primary/70" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
