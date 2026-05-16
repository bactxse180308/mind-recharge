import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatApi, type ChatConversation } from "@/services/chatApi";
import { imageApi } from "@/services/imageApi";

function getLastMessagePreview(conv: ChatConversation) {
  if (!conv.lastMessage) return "Bắt đầu trò chuyện";
  const { content, imageKey, mine } = conv.lastMessage;
  const body = content?.trim() || (imageKey ? "Đã gửi một hình ảnh" : "");
  if (!body) return "Bắt đầu trò chuyện";
  return mine ? `Bạn: ${body}` : body;
}

const FriendsWidget = () => {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: () => chatApi.listConversations(0, 5),
  });

  const conversations = data?.data?.slice(0, 3) ?? [];

  if (conversations.length === 0) return null;

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <span className="text-sm font-medium text-foreground/80">Bạn bè</span>
        </div>
        <button
          onClick={() => navigate("/friends")}
          className="flex items-center gap-0.5 text-xs text-primary/70 hover:text-primary transition-colors"
        >
          Xem tất cả <ChevronRight size={12} />
        </button>
      </div>

      <div className="space-y-2">
        {conversations.map((conv) => {
          const name =
            conv.type === "SUPPORT"
              ? "MindRecharge Support"
              : (conv.counterpart?.displayName ?? "Bạn bè");
          const imgSrc = imageApi.buildViewUrl(
            conv.counterpart?.avatarKey,
            conv.counterpart?.avatarUrl
          );
          const initial = name.trim().charAt(0).toUpperCase();
          const preview = getLastMessagePreview(conv);

          return (
            <button
              key={conv.id}
              onClick={() => navigate(`/friends/chat/${conv.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={imgSrc} />
                  <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                </Avatar>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[9px] text-primary-foreground font-bold">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground/60 truncate">{preview}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FriendsWidget;
