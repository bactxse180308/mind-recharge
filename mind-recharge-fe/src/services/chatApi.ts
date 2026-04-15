import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

export interface ChatUserSummary {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  avatarKey?: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content?: string;
  imageUrl?: string;
  imageKey?: string;
  sender: ChatUserSummary;
  mine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  id: number;
  type: "DIRECT" | "SUPPORT";
  counterpart?: ChatUserSummary;
  participants: ChatUserSummary[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  counterpartLastReadAt?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface PagedApiResponse<T> extends ApiResponse<T> {
  meta?: ChatPageMeta;
}

export interface ChatRealtimeEvent {
  eventType: string;
  conversation?: ChatConversation;
  message?: ChatMessage;
  typingUser?: ChatUserSummary;
  typing?: boolean;
}

export const chatApi = {
  listConversations: (page = 0, size = 20) =>
    apiFetch<ApiResponse<ChatConversation[]>>(
      `/api/v1/chat/conversations?page=${page}&size=${size}`
    ),

  openDirectConversation: (friendUserId: number) =>
    apiFetch<ApiResponse<ChatConversation>>(
      `/api/v1/chat/conversations/direct/${friendUserId}`,
      { method: "POST" }
    ),

  openSupportConversation: () =>
    apiFetch<ApiResponse<ChatConversation>>("/api/v1/chat/conversations/support", {
      method: "POST",
    }),

  listMessages: (conversationId: number, page = 0, size = 50) =>
    apiFetch<PagedApiResponse<ChatMessage[]>>(
      `/api/v1/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`
    ),

  sendMessage: (
    conversationId: number,
    body: { content?: string; imageUrl?: string; imageKey?: string }
  ) =>
    apiFetch<ApiResponse<ChatMessage>>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    ),

  markAsRead: (conversationId: number) =>
    apiFetch<void>(`/api/v1/chat/conversations/${conversationId}/read`, {
      method: "POST",
    }),

  setTyping: (conversationId: number, typing: boolean) =>
    apiFetch<void>(`/api/v1/chat/conversations/${conversationId}/typing`, {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        typing,
      }),
    }),
};
