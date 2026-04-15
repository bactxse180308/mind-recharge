import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

export interface NotificationActor {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  avatarKey?: string;
}

export interface NotificationItem {
  id: number;
  type: "CHAT_MESSAGE";
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string;
  conversationId?: number;
  messageId?: number;
  payloadJson?: string;
  actor?: NotificationActor;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationUnreadCount {
  unreadCount: number;
}

export interface NotificationRealtimeEvent {
  eventType: string;
  unreadCount: number;
  notification?: NotificationItem;
}

export const notificationApi = {
  listNotifications: (page = 0, size = 20) =>
    apiFetch<ApiResponse<NotificationItem[]>>(
      `/api/v1/notifications?page=${page}&size=${size}`
    ),

  getUnreadCount: () =>
    apiFetch<ApiResponse<NotificationUnreadCount>>("/api/v1/notifications/unread-count"),

  markAsRead: (notificationId: number) =>
    apiFetch<ApiResponse<NotificationItem>>(`/api/v1/notifications/${notificationId}/read`, {
      method: "POST",
    }),

  markAllAsRead: () =>
    apiFetch<void>("/api/v1/notifications/read-all", {
      method: "POST",
    }),
};
