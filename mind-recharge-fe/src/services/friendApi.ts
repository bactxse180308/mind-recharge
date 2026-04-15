import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "./authApi";

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface FriendUserSummary {
  id: number;
  email: string;
  displayName: string;
  avatarUrl?: string;
  avatarKey?: string;
}

export interface FriendRequest {
  id: number;
  sender: FriendUserSummary;
  receiver: FriendUserSummary;
  message?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  friendshipId: number;
  friend: FriendUserSummary;
  createdAt: string;
}

export interface FriendSearchResult extends FriendUserSummary {
  relationStatus: "NONE" | "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED";
}

export interface FriendRealtimeEvent {
  eventType: string;
  request?: FriendRequest;
  friendship?: Friendship;
}

export const friendApi = {
  listFriends: (page = 0, size = 20) =>
    apiFetch<ApiResponse<Friendship[]>>(`/api/v1/friends?page=${page}&size=${size}`),

  listIncomingRequests: (page = 0, size = 20) =>
    apiFetch<ApiResponse<FriendRequest[]>>(
      `/api/v1/friends/requests/incoming?page=${page}&size=${size}`
    ),

  listOutgoingRequests: (page = 0, size = 20) =>
    apiFetch<ApiResponse<FriendRequest[]>>(
      `/api/v1/friends/requests/outgoing?page=${page}&size=${size}`
    ),

  searchUsers: (keyword: string, page = 0, size = 20) =>
    apiFetch<ApiResponse<FriendSearchResult[]>>(
      `/api/v1/friends/search?q=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
    ),

  sendRequest: (receiverId: number, message?: string) =>
    apiFetch<ApiResponse<FriendRequest>>("/api/v1/friends/requests", {
      method: "POST",
      body: JSON.stringify({ receiverId, message }),
    }),

  acceptRequest: (requestId: number) =>
    apiFetch<ApiResponse<FriendRequest>>(`/api/v1/friends/requests/${requestId}/accept`, {
      method: "POST",
    }),

  rejectRequest: (requestId: number) =>
    apiFetch<ApiResponse<FriendRequest>>(`/api/v1/friends/requests/${requestId}/reject`, {
      method: "POST",
    }),

  cancelRequest: (requestId: number) =>
    apiFetch<ApiResponse<FriendRequest>>(`/api/v1/friends/requests/${requestId}/cancel`, {
      method: "POST",
    }),
};
