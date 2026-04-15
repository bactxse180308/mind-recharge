import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Search,
  UserPlus,
  MessageCircle,
  Check,
  X,
  Shield,
  LoaderCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  friendApi,
  type Friendship,
  type FriendRequest,
  type FriendSearchResult,
} from "@/services/friendApi";
import { chatApi, type ChatConversation } from "@/services/chatApi";
import { imageApi } from "@/services/imageApi";
import { createRealtimeClient } from "@/lib/chatRealtime";

type Tab = "friends" | "search" | "requests";

function getInitial(value?: string) {
  return (value || "U").trim().charAt(0).toUpperCase();
}

function formatCompactDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN");
}

function getLastMessagePreview(conversation?: ChatConversation, fallback?: string) {
  if (!conversation?.lastMessage) {
    return fallback ?? "";
  }

  const message = conversation.lastMessage;
  const body = message.content?.trim() || (message.imageKey ? "Đã gửi một hình ảnh" : "");
  if (!body) {
    return fallback ?? "";
  }

  return message.mine ? `Bạn: ${body}` : body;
}

const Friends = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const tab = (searchParams.get("tab") as Tab) || "friends";
  const setTab = (nextTab: Tab) =>
    nextTab === "friends" ? setSearchParams({}) : setSearchParams({ tab: nextTab });

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  const { data: friendsRes, isLoading: isLoadingFriends } = useQuery({
    queryKey: ["friends-list"],
    queryFn: () => friendApi.listFriends(),
  });
  const { data: incomingRes, isLoading: isLoadingIncoming } = useQuery({
    queryKey: ["friend-requests-incoming"],
    queryFn: () => friendApi.listIncomingRequests(),
  });
  const { data: outgoingRes } = useQuery({
    queryKey: ["friend-requests-outgoing"],
    queryFn: () => friendApi.listOutgoingRequests(),
  });
  const { data: conversationsRes } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => chatApi.listConversations(),
  });
  const { data: searchRes, isFetching: isSearching } = useQuery({
    queryKey: ["friend-search", deferredSearchQuery],
    queryFn: () => friendApi.searchUsers(deferredSearchQuery),
    enabled: deferredSearchQuery.length > 0,
  });

  const friends = friendsRes?.data ?? [];
  const incomingRequests = incomingRes?.data ?? [];
  const outgoingRequests = outgoingRes?.data ?? [];
  const conversations = conversationsRes?.data ?? [];
  const searchResults = searchRes?.data ?? [];

  useEffect(() => {
    const client = createRealtimeClient();
    if (!client) return;

    client.onConnect = () => {
      client.subscribe("/user/queue/friends", () => {
        qc.invalidateQueries({ queryKey: ["friends-list"] });
        qc.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
        qc.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
        qc.invalidateQueries({ queryKey: ["friend-search"] });
      });

      client.subscribe("/user/queue/chat", (frame) => {
        qc.invalidateQueries({ queryKey: ["chat-conversations"] });

        try {
          const payload = JSON.parse(frame.body) as { conversation?: { id?: number } };
          if (payload.conversation?.id) {
            qc.invalidateQueries({ queryKey: ["chat-messages", payload.conversation.id] });
          }
        } catch {
          qc.invalidateQueries({ queryKey: ["chat-messages"] });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error", frame.headers["message"], frame.body);
    };

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [qc]);

  const { mutate: sendFriendRequest, isPending: isSendingRequest } = useMutation({
    mutationFn: ({ receiverId, requestMessage }: { receiverId: number; requestMessage?: string }) =>
      friendApi.sendRequest(receiverId, requestMessage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-search"] });
      qc.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
      toast.success("Đã gửi lời mời kết bạn.");
    },
    onError: (err: any) => toast.error(err?.message || "Không thể gửi lời mời kết bạn"),
  });

  const { mutate: acceptRequest, isPending: isAcceptingRequest } = useMutation({
    mutationFn: (requestId: number) => friendApi.acceptRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends-list"] });
      qc.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      toast.success("Đã chấp nhận lời mời kết bạn.");
    },
    onError: (err: any) => toast.error(err?.message || "Không thể chấp nhận lời mời"),
  });

  const { mutate: rejectRequest, isPending: isRejectingRequest } = useMutation({
    mutationFn: (requestId: number) => friendApi.rejectRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
      toast.success("Đã từ chối lời mời.");
    },
    onError: (err: any) => toast.error(err?.message || "Không thể từ chối lời mời"),
  });

  const { mutate: openDirectConversation, isPending: isOpeningDirect } = useMutation({
    mutationFn: async (friendship: Friendship) => {
      const result = await chatApi.openDirectConversation(friendship.friend.id);
      return result.data;
    },
    onSuccess: (conversation) => {
      navigate(`/friends/chat/${conversation.id}`);
    },
    onError: (err: any) => toast.error(err?.message || "Không thể mở cuộc trò chuyện"),
  });

  const { mutate: openSupportConversation, isPending: isOpeningSupport } = useMutation({
    mutationFn: () => chatApi.openSupportConversation(),
    onSuccess: (result) => {
      navigate(`/friends/chat/${result.data.id}`);
    },
    onError: (err: any) => toast.error(err?.message || "Không thể mở chat hỗ trợ"),
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "friends", label: "Bạn bè", count: friends.length },
    { id: "requests", label: "Lời mời", count: incomingRequests.length },
    { id: "search", label: "Tìm kiếm" },
  ];

  const conversationLookup = new Map<number, ChatConversation>();
  for (const conversation of conversations) {
    if (conversation.type === "DIRECT" && conversation.counterpart?.id) {
      conversationLookup.set(conversation.counterpart.id, conversation);
    }
  }

  const sortedFriends = [...friends].sort((left, right) => {
    const leftConversation = conversationLookup.get(left.friend.id);
    const rightConversation = conversationLookup.get(right.friend.id);

    const leftUnread = (leftConversation?.unreadCount ?? 0) > 0 ? 1 : 0;
    const rightUnread = (rightConversation?.unreadCount ?? 0) > 0 ? 1 : 0;
    if (leftUnread !== rightUnread) {
      return rightUnread - leftUnread;
    }

    const leftLastMessageAt = leftConversation?.lastMessageAt
      ? new Date(leftConversation.lastMessageAt).getTime()
      : 0;
    const rightLastMessageAt = rightConversation?.lastMessageAt
      ? new Date(rightConversation.lastMessageAt).getTime()
      : 0;
    if (leftLastMessageAt !== rightLastMessageAt) {
      return rightLastMessageAt - leftLastMessageAt;
    }

    return right.friendshipId - left.friendshipId;
  });

  return (
    <div className="min-h-screen healing-gradient-bg px-5 pt-20 pb-28">
      <div className="max-w-[480px] mx-auto page-enter">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="text-muted-foreground hover:text-foreground transition-colors btn-press"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-light text-foreground">Bạn bè</h1>
        </div>

        <div className="mb-4 rounded-3xl border border-primary/15 bg-gradient-to-r from-primary/12 to-cyan-400/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">MindRecharge Support</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Chat trực tiếp với admin khi bạn cần hỗ trợ.
              </p>
            </div>
            <button
              onClick={() => openSupportConversation()}
              disabled={isOpeningSupport}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary/15 px-4 text-xs font-medium text-primary transition hover:bg-primary/25 disabled:opacity-50"
            >
              {isOpeningSupport ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Shield size={14} />
              )}
              Hỗ trợ
            </button>
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-2xl border border-border/20 bg-secondary/30 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-xl px-2 py-2 text-xs font-medium transition-all duration-300 btn-press ${
                tab === item.id
                  ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(167,139,250,0.1)]"
                  : "text-muted-foreground/60 hover:text-foreground/80"
              }`}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={`ml-1 ${
                    tab === item.id ? "text-primary/70" : "text-muted-foreground/40"
                  }`}
                >
                  ({item.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "friends" && (
          <div className="space-y-3 float-up">
            {isLoadingFriends ? (
              <div className="flex justify-center pt-6">
                <LoaderCircle size={18} className="animate-spin text-primary/70" />
              </div>
            ) : friends.length === 0 ? (
              <p className="mt-8 text-center text-sm italic text-muted-foreground/50">
                Bạn chưa có kết nối nào. Hãy tìm kiếm và gửi lời mời kết bạn.
              </p>
            ) : (
              sortedFriends.map((friendship) => {
                const avatarSrc = imageApi.buildViewUrl(
                  friendship.friend.avatarKey,
                  friendship.friend.avatarUrl
                );
                const conversation = conversationLookup.get(friendship.friend.id);
                const isUnread = (conversation?.unreadCount ?? 0) > 0;
                const preview = getLastMessagePreview(conversation, friendship.friend.email);

                return (
                  <div
                    key={friendship.friendshipId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDirectConversation(friendship)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDirectConversation(friendship);
                      }
                    }}
                    className="healing-card flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white/[0.02] focus:outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 border border-primary/20 bg-primary/10">
                        <AvatarImage
                          src={avatarSrc}
                          alt={friendship.friend.displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/15 text-primary">
                          {getInitial(friendship.friend.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p
                          className={`text-sm text-foreground ${
                            isUnread ? "font-semibold" : "font-medium opacity-80"
                          }`}
                        >
                          {friendship.friend.displayName}
                        </p>
                        <p
                          className={`truncate text-xs ${
                            isUnread
                              ? "font-semibold text-foreground/90"
                              : "text-muted-foreground/70"
                          }`}
                        >
                          {preview}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/40">
                          {conversation?.lastMessageAt
                            ? `Hoạt động ${formatCompactDate(conversation.lastMessageAt)}`
                            : `Bạn bè từ ${formatCompactDate(friendship.createdAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all">
                      <MessageCircle size={16} />
                      {(conversation?.unreadCount || 0) > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-400 px-1.5 py-0.5 text-[10px] text-white">
                          {conversation?.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-3 float-up">
            {isLoadingIncoming ? (
              <div className="flex justify-center pt-6">
                <LoaderCircle size={18} className="animate-spin text-primary/70" />
              </div>
            ) : incomingRequests.length === 0 ? (
              <p className="mt-8 text-center text-sm italic text-muted-foreground/50">
                Không có lời mời kết bạn nào.
              </p>
            ) : (
              incomingRequests.map((request: FriendRequest) => {
                const avatarSrc = imageApi.buildViewUrl(
                  request.sender.avatarKey,
                  request.sender.avatarUrl
                );

                return (
                  <div key={request.id} className="healing-card p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar className="h-11 w-11 border border-primary/20 bg-primary/10">
                        <AvatarImage
                          src={avatarSrc}
                          alt={request.sender.displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/15 text-primary">
                          {getInitial(request.sender.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {request.sender.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/60">
                          {request.message || `${request.sender.displayName} muốn kết bạn với bạn.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.id)}
                        disabled={isAcceptingRequest || isRejectingRequest}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 py-2 text-xs font-medium text-primary transition-all btn-press hover:bg-primary/25 disabled:opacity-50"
                      >
                        <Check size={14} /> Chấp nhận
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        disabled={isAcceptingRequest || isRejectingRequest}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-secondary/50 py-2 text-xs font-medium text-muted-foreground transition-all btn-press hover:bg-secondary/70 disabled:opacity-50"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {outgoingRequests.length > 0 && (
              <div className="pt-3">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/45">
                  Bạn đã gửi
                </p>
                <div className="space-y-3">
                  {outgoingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="healing-card flex items-center justify-between p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {request.receiver.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground/60">
                          Đang chờ phản hồi
                        </p>
                      </div>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] text-primary">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "search" && (
          <div className="float-up">
            <div className="relative mb-4">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm bạn bè theo tên hoặc email..."
                className="w-full rounded-2xl border border-border/20 bg-secondary/50 py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/30 transition-all glow-cursor focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-3">
              {isSearching ? (
                <div className="flex justify-center pt-6">
                  <LoaderCircle size={18} className="animate-spin text-primary/70" />
                </div>
              ) : deferredSearchQuery.length === 0 ? (
                <p className="mt-8 text-center text-sm italic text-muted-foreground/50">
                  Nhập tên hoặc email để tìm người dùng.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="mt-8 text-center text-sm italic text-muted-foreground/50">
                  Không tìm thấy ai phù hợp với từ khóa "{deferredSearchQuery}".
                </p>
              ) : (
                searchResults.map((user: FriendSearchResult) => {
                  const avatarSrc = imageApi.buildViewUrl(user.avatarKey, user.avatarUrl);
                  const actionLabel =
                    user.relationStatus === "FRIEND"
                      ? "Đã là bạn"
                      : user.relationStatus === "REQUEST_SENT"
                        ? "Đã gửi lời mời"
                        : user.relationStatus === "REQUEST_RECEIVED"
                          ? "Đã gửi cho bạn"
                          : "Kết bạn";

                  return (
                    <div
                      key={user.id}
                      className="healing-card flex items-center justify-between p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-11 w-11 border border-primary/20 bg-primary/10">
                          <AvatarImage
                            src={avatarSrc}
                            alt={user.displayName}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/15 text-primary">
                            {getInitial(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{user.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground/60">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest({ receiverId: user.id })}
                        disabled={isSendingRequest || user.relationStatus !== "NONE"}
                        className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-3 py-2 text-xs font-medium text-primary transition-all btn-press hover:bg-primary/25 disabled:opacity-50 disabled:hover:bg-primary/15"
                      >
                        <UserPlus size={14} /> {actionLabel}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
