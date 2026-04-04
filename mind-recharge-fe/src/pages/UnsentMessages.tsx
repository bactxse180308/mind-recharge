import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Message {
  id: number;
  text: string;
  time: Date;
  dissolving: boolean;
}

const UnsentMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Mình nhớ cậu. Nhưng mình biết mình cần phải buông.", time: new Date(Date.now() - 86400000), dissolving: false },
    { id: 2, text: "Giá như mọi thứ khác đi...", time: new Date(Date.now() - 3600000), dissolving: false },
  ]);
  const [input, setInput] = useState("");
  const [releaseMsg, setReleaseMsg] = useState<string | null>(null);

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, time: new Date(), dissolving: false }]);
    setInput("");
  };

  const dissolveMessage = (id: number) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, dissolving: true } : m));
    setReleaseMsg("Bạn vừa buông thêm một chút 💜");
    setTimeout(() => {
      setMessages(msgs => msgs.filter(m => m.id !== id));
      setReleaseMsg(null);
    }, 900);
  };

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col">
      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1 px-6 pt-12 pb-24 page-enter">
        <div className="mb-6">
          <h1 className="text-xl font-light text-foreground mb-1">Chưa gửi</h1>
          <p className="text-sm text-muted-foreground">Viết ra, nhưng không gửi đi. Đây là nơi an toàn.</p>
          <p className="text-xs text-muted-foreground/40 italic mt-2">Chạm giữ để buông bỏ</p>
        </div>

        {/* Release feedback */}
        {releaseMsg && (
          <div className="text-center mb-4 float-up">
            <p className="text-xs text-primary/70">{releaseMsg}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto mb-4">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={`flex justify-end float-up ${msg.dissolving ? "dissolve" : ""}`}
              style={{ animationDelay: msg.dissolving ? "0s" : `${i * 0.08}s` }}
            >
              <div
                onContextMenu={(e) => { e.preventDefault(); dissolveMessage(msg.id); }}
                onTouchStart={() => {
                  const timer = setTimeout(() => dissolveMessage(msg.id), 600);
                  const clear = () => { clearTimeout(timer); document.removeEventListener("touchend", clear); };
                  document.addEventListener("touchend", clear);
                }}
                className="max-w-[80%] healing-card p-3.5 cursor-pointer group transition-all duration-500 blur-[2px] hover:blur-none"
              >
                <p className="text-sm text-foreground/90 leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-muted-foreground/50 mt-1 block text-right">
                  {msg.time.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trigger link */}
        <button
          onClick={() => navigate("/trigger")}
          className="text-xs text-muted-foreground/40 mb-3 hover:text-muted-foreground transition-colors btn-press"
        >
          Mình muốn nhắn thật cho họ...
        </button>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Viết những gì bạn muốn nói..."
            className="flex-1 bg-secondary/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 glow-cursor transition-all"
          />
          {input.trim() && (
            <button onClick={send} className="bg-primary/20 text-primary px-4 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press">
              Gửi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnsentMessages;
