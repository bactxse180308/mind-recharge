import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, LoaderCircle, Send, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCall } from "@/contexts/CallContext";
import ImageLightbox from "@/components/ImageLightbox";
import type { ApiResponse } from "@/services/authApi";
import {
  chatApi,
  type ChatConversation,
  type ChatMessage,
  type ChatRealtimeEvent,
  type PagedApiResponse,
} from "@/services/chatApi";
import { imageApi } from "@/services/imageApi";
import { createRealtimeClient } from "@/lib/chatRealtime";

const PAGE_SIZE = 30;

function formatDateTime(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getInitial(value?: string) {
  return (value || "U").trim().charAt(0).toUpperCase();
}

function upsertMessageDescending(messages: ChatMessage[], incoming: ChatMessage) {
  const withoutCurrent = messages.filter((message) => message.id !== incoming.id);
  return [...withoutCurrent, incoming].sort((left, right) => {
    const timeDiff =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    return timeDiff !== 0 ? timeDiff : right.id - left.id;
  });
}

function upsertConversation(conversations: ChatConversation[], incoming: ChatConversation) {
  const remaining = conversations.filter((conversation) => conversation.id !== incoming.id);
  return [incoming, ...remaining];
}

function isNearBottom(element: HTMLDivElement) {
  return element.scrollHeight - element.clientHeight - element.scrollTop < 96;
}

const FriendsChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const convId = Number(conversationId);
  const { activeCall, incomingCall, startOutgoingCall } = useCall();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prependMeasurementRef = useRef<{ height: number; top: number } | null>(null);
  const initializedConversationRef = useRef<number | null>(null);
  const previousMessageCountRef = useRef(0);
  const isAtBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const typingStopTimerRef = useRef<number | null>(null);
  const typingClearTimerRef = useRef<number | null>(null);
  const sentTypingRef = useRef(false);

  const [message, setMessage] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftImageKey, setDraftImageKey] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [typingLabel, setTypingLabel] = useState("");
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const [isAtBottomState, setIsAtBottomState] = useState(true);

  const { data: conversationsRes, isLoading: isLoadingConversation } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => chatApi.listConversations(),
  });

  const {
    data: pagedMessages,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat-messages", convId],
    queryFn: ({ pageParam }) => chatApi.listMessages(convId, pageParam, PAGE_SIZE),
    enabled: !!convId && !Number.isNaN(convId),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta || lastPage.meta.last) return undefined;
      return lastPage.meta.page + 1;
    },
  });

  const conversations = conversationsRes?.data ?? [];
  const pages = pagedMessages?.pages ?? [];

  const messages = useMemo(
    () =>
      pages
        .slice()
        .reverse()
        .flatMap((page) => [...(page.data ?? [])].reverse()),
    [pages]
  );

  const conversation = conversations.find((item) => item.id === convId);
  const title =
    conversation?.type === "SUPPORT"
      ? "MindRecharge Support"
      : conversation?.counterpart?.displayName ?? "...";
  const subtitle =
    conversation?.type === "SUPPORT"
      ? "Hỗ trợ hệ thống"
      : conversation?.counterpart?.email ?? "";
  const avatarSrc = imageApi.buildViewUrl(
    conversation?.counterpart?.avatarKey,
    conversation?.counterpart?.avatarUrl
  );
  const isCallBusy = !!activeCall || !!incomingCall;

  const latestOwnMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].mine) {
        return messages[index];
      }
    }
    return undefined;
  }, [messages]);

  const counterpartHasSeenLatestOwnMessage =
    !!latestOwnMessage &&
    !!conversation?.counterpartLastReadAt &&
    new Date(conversation.counterpartLastReadAt).getTime() >=
      new Date(latestOwnMessage.createdAt).getTime();

  const newestMessage = messages[messages.length - 1];

  useEffect(() => {
    initializedConversationRef.current = null;
    previousMessageCountRef.current = 0;
    prependMeasurementRef.current = null;
    isAtBottomRef.current = true;
    forceScrollToBottomRef.current = false;
    setHasUnreadBelow(false);
    setIsAtBottomState(true);
    setTypingLabel("");
  }, [convId]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (prependMeasurementRef.current) {
      const measurement = prependMeasurementRef.current;
      prependMeasurementRef.current = null;
      container.scrollTop = measurement.top + (container.scrollHeight - measurement.height);
      previousMessageCountRef.current = messages.length;
      return;
    }

    if (initializedConversationRef.current !== convId) {
      if (messages.length === 0) return;
      container.scrollTop = container.scrollHeight;
      initializedConversationRef.current = convId;
      previousMessageCountRef.current = messages.length;
      setHasUnreadBelow(false);
      setIsAtBottomState(true);
      return;
    }

    if (messages.length > previousMessageCountRef.current) {
      if (forceScrollToBottomRef.current || isAtBottomRef.current) {
        container.scrollTop = container.scrollHeight;
        setHasUnreadBelow(false);
      } else if (newestMessage && !newestMessage.mine) {
        setHasUnreadBelow(true);
      }
    }

    previousMessageCountRef.current = messages.length;
    forceScrollToBottomRef.current = false;
  }, [convId, messages, newestMessage]);

  useEffect(() => {
    if (!convId || Number.isNaN(convId) || !conversation) return;
    if (!isAtBottomState) return;
    if ((conversation.unreadCount ?? 0) <= 0) return;
    chatApi.markAsRead(convId).catch(() => undefined);
  }, [convId, conversation?.id, conversation?.unreadCount, isAtBottomState]);

  useEffect(() => {
    const client = createRealtimeClient();
    if (!client) return;

    client.onConnect = () => {
      client.subscribe("/user/queue/chat", (frame) => {
        try {
          const payload = JSON.parse(frame.body) as ChatRealtimeEvent;

          if (payload.eventType === "chat.typing") {
            const eventConversationId = payload.conversation?.id;
            if (eventConversationId && eventConversationId !== convId) {
              return;
            }

            const typingDisplayName =
              payload.typingUser?.displayName ||
              payload.conversation?.counterpart?.displayName ||
              "Đối phương";

            if (typingClearTimerRef.current) {
              window.clearTimeout(typingClearTimerRef.current);
            }

            if (payload.typing) {
              setTypingLabel(`${typingDisplayName} đang nhập...`);
              typingClearTimerRef.current = window.setTimeout(() => {
                setTypingLabel("");
              }, 1600);
            } else {
              setTypingLabel("");
            }
            return;
          }

          if (payload.conversation) {
            qc.setQueryData<ApiResponse<ChatConversation[]>>(
              ["chat-conversations"],
              (current) =>
                current
                  ? {
                      ...current,
                      data: upsertConversation(current.data ?? [], payload.conversation),
                    }
                  : current
            );
          }

          if (payload.message && payload.conversation?.id) {
            qc.setQueryData<InfiniteData<PagedApiResponse<ChatMessage[]>, number>>(
              ["chat-messages", payload.conversation.id],
              (current) => {
                if (!current || current.pages.length === 0) {
                  return current;
                }

                const [newestPage, ...olderPages] = current.pages;
                return {
                  ...current,
                  pages: [
                    {
                      ...newestPage,
                      data: upsertMessageDescending(newestPage.data ?? [], payload.message),
                    },
                    ...olderPages,
                  ],
                };
              }
            );
          }

          qc.invalidateQueries({ queryKey: ["chat-conversations"] });
        } catch {
          qc.invalidateQueries({ queryKey: ["chat-conversations"] });
          qc.invalidateQueries({ queryKey: ["chat-messages"] });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error("STOMP error", frame.headers["message"], frame.body);
    };

    client.activate();

    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (typingClearTimerRef.current) {
        window.clearTimeout(typingClearTimerRef.current);
      }
      client.deactivate();
    };
  }, [convId, qc]);

  const publishTyping = (typing: boolean) => {
    if (!convId || Number.isNaN(convId)) {
      return false;
    }

    chatApi.setTyping(convId, typing).catch(() => undefined);
    return true;
  };

  useEffect(() => {
    const hasText = message.trim().length > 0;

    if (!hasText) {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (sentTypingRef.current && publishTyping(false)) {
        sentTypingRef.current = false;
      }
      return;
    }

    if (!sentTypingRef.current && publishTyping(true)) {
      sentTypingRef.current = true;
    }

    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = window.setTimeout(() => {
      if (publishTyping(false)) {
        sentTypingRef.current = false;
      }
    }, 1200);

    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
    };
  }, [convId, message]);

  const { mutate: uploadChatImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (file: File) => imageApi.upload(file),
    onSuccess: (response) => {
      setDraftImageUrl(response.data.imageUrl);
      setDraftImageKey(response.data.key);
      toast.success("Ảnh đã sẵn sàng để gửi.");
    },
    onError: () => {
      toast.error("Không thể tải ảnh lên");
    },
  });

  const { mutate: sendMessage, isPending: isSendingMessage } = useMutation({
    mutationFn: () =>
      chatApi.sendMessage(convId, {
        content: message.trim() || undefined,
        imageUrl: draftImageUrl || undefined,
        imageKey: draftImageKey || undefined,
      }),
    onSuccess: (response) => {
      if (sentTypingRef.current && publishTyping(false)) {
        sentTypingRef.current = false;
      }

      setMessage("");
      setDraftImageUrl("");
      setDraftImageKey("");
      setTypingLabel("");
      forceScrollToBottomRef.current = true;

      qc.setQueryData<InfiniteData<PagedApiResponse<ChatMessage[]>, number>>(
        ["chat-messages", convId],
        (current) => {
          if (!current || current.pages.length === 0) {
            return current;
          }

          const [newestPage, ...olderPages] = current.pages;
          return {
            ...current,
            pages: [
              {
                ...newestPage,
                data: upsertMessageDescending(newestPage.data ?? [], response.data),
              },
              ...olderPages,
            ],
          };
        }
      );

      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
    onError: () => {
      toast.error("Không thể gửi tin nhắn");
    },
  });

  const handleSend = () => {
    if ((!message.trim() && !draftImageUrl) || isSendingMessage || isUploadingImage) {
      return;
    }
    handleJumpToLatest();
    sendMessage();
  };

  const handleImageSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadChatImage(file);
    event.target.value = "";
  };

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const nearBottom = isNearBottom(container);
    isAtBottomRef.current = nearBottom;
    setIsAtBottomState(nearBottom);

    if (nearBottom) {
      setHasUnreadBelow(false);
    }

    if (container.scrollTop <= 120 && hasNextPage && !isFetchingNextPage) {
      prependMeasurementRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
      fetchNextPage();
    }
  };

  const handleJumpToLatest = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    forceScrollToBottomRef.current = true;
    container.scrollTop = container.scrollHeight;
    isAtBottomRef.current = true;
    setIsAtBottomState(true);
    setHasUnreadBelow(false);
  };

  if (!convId || Number.isNaN(convId)) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col healing-gradient-bg">
      <div className="flex-shrink-0 border-b border-border/15 bg-background/40 pt-[70px] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[480px] items-center gap-3 px-5 py-3">
          <button
            onClick={() => navigate("/friends")}
            className="mr-1 flex-shrink-0 text-muted-foreground transition-colors btn-press hover:text-foreground"
          >
            <ArrowLeft size={20} />
          </button>
          {isLoadingConversation ? (
            <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-full bg-secondary/40" />
          ) : (
            <Avatar className="h-10 w-10 flex-shrink-0 border border-primary/20 bg-primary/10">
              <AvatarImage src={avatarSrc} alt={title} className="object-cover" />
              <AvatarFallback className="bg-primary/15 text-sm text-primary">
                {getInitial(title)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">
              {isLoadingConversation ? (
                <span className="inline-block h-3.5 w-28 animate-pulse rounded bg-secondary/40" />
              ) : (
                title
              )}
            </h3>
            <p className="truncate text-xs text-muted-foreground/60">
              {typingLabel || subtitle}
            </p>
          </div>
          <button
            type="button"
            disabled={!conversation || isCallBusy}
            onClick={() => conversation && void startOutgoingCall(conversation)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
            title="Goi video"
          >
            <Video size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-[480px] space-y-2 px-5 py-4">
          {isFetchingNextPage && (
            <div className="flex justify-center pb-3">
              <LoaderCircle size={18} className="animate-spin text-primary/70" />
            </div>
          )}

          {isLoadingMessages ? (
            <div className="flex justify-center pt-8">
              <LoaderCircle size={20} className="animate-spin text-primary/70" />
            </div>
          ) : messages.length === 0 ? (
            <p className="pt-8 text-center text-xs italic text-muted-foreground/50">
              {conversation?.type === "SUPPORT"
                ? "Hãy bắt đầu cuộc trò chuyện với đội ngũ hỗ trợ."
                : `Hãy gửi lời động viên đến ${title} nhé.`}
            </p>
          ) : (
            messages.map((chatMessage) => {
              const showSeen =
                chatMessage.mine &&
                latestOwnMessage?.id === chatMessage.id &&
                counterpartHasSeenLatestOwnMessage;

              return (
                <div
                  key={chatMessage.id}
                  className={`flex ${chatMessage.mine ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[82%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        chatMessage.mine
                          ? "rounded-tr-sm border border-primary/20 bg-primary/15"
                          : "rounded-tl-sm border border-border/20 bg-secondary/50"
                      }`}
                    >
                      {!chatMessage.mine && (
                        <p className="mb-1 text-[11px] text-primary/80">
                          {chatMessage.sender.displayName}
                        </p>
                      )}
                      {chatMessage.content && (
                        <p className="whitespace-pre-wrap text-sm text-foreground/90">
                          {chatMessage.content}
                        </p>
                      )}
                      {chatMessage.imageKey && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImageUrl(
                              imageApi.buildViewUrl(
                                chatMessage.imageKey,
                                chatMessage.imageUrl
                              ) || ""
                            )
                          }
                          className="mt-2 block w-full"
                        >
                          <img
                            src={imageApi.buildViewUrl(
                              chatMessage.imageKey,
                              chatMessage.imageUrl
                            )}
                            alt="Ảnh chat"
                            className="max-h-56 w-full rounded-xl object-cover"
                          />
                        </button>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/45">
                        {formatDateTime(chatMessage.createdAt)}
                      </p>
                    </div>
                    {showSeen && (
                      <p className="mt-1 text-right text-[11px] font-medium text-primary/75">
                        Đã xem
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {hasUnreadBelow && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[150px] z-20 flex justify-center">
          <button
            onClick={handleJumpToLatest}
            className="pointer-events-auto rounded-full border border-primary/20 bg-background/90 px-4 py-2 text-xs font-medium text-primary shadow-lg backdrop-blur btn-press"
          >
            Tin nhắn mới
          </button>
        </div>
      )}

      <div className="flex-shrink-0 border-t border-border/15 bg-background/60 pb-[70px] backdrop-blur-xl">
        <div className="mx-auto max-w-[480px] px-4 py-3">
          {draftImageUrl && (
            <div className="mb-3 rounded-3xl border border-primary/15 bg-background/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ảnh đính kèm</span>
                <button
                  type="button"
                  onClick={() => {
                    setDraftImageUrl("");
                    setDraftImageKey("");
                  }}
                  className="rounded-full p-1 text-muted-foreground/70 transition hover:bg-secondary/40 hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(draftImageUrl)}
                className="block w-full"
              >
                <img
                  src={draftImageUrl}
                  alt="Xem trước ảnh đính kèm"
                  className="max-h-60 w-full rounded-2xl object-cover"
                />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary/70 hover:text-foreground">
              {isUploadingImage ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ImagePlus size={18} />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleImageSelected}
                disabled={isUploadingImage || isSendingMessage}
              />
            </label>

            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSend()}
              placeholder="Viết lời nhắn..."
              className="flex-1 rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 transition-all glow-cursor focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            <button
              onClick={handleSend}
              disabled={
                (!message.trim() && !draftImageUrl) ||
                isSendingMessage ||
                isUploadingImage
              }
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary transition-all btn-press hover:bg-primary/30 disabled:opacity-40"
            >
              {isSendingMessage ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <ImageLightbox
        open={!!previewImageUrl}
        imageUrl={previewImageUrl}
        alt="Ảnh chat"
        onClose={() => setPreviewImageUrl("")}
      />
    </div>
  );
};

export default FriendsChat;
