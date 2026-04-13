import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  journalApi,
  type JournalResponse,
  type JournalMoodCode,
} from "@/services/journalApi";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { HealingTimeline } from "@/components/HealingTimeline";

const MOOD_OPTIONS: { code: JournalMoodCode; emoji: string }[] = [
  { code: "SAD", emoji: "😞" },
  { code: "NEUTRAL", emoji: "😐" },
  { code: "BETTER", emoji: "🙂" },
  { code: "CALM", emoji: "😌" },
  { code: "LOVE", emoji: "💜" },
];

const microcopies = [
  "Bạn không cần viết hay, chỉ cần thật",
  "Không phải bạn nhớ họ, mà là bạn nhớ cảm giác",
  "Bạn không yếu, bạn chỉ đang cảm nhận",
  "Healing không phải là quên, mà là không còn đau",
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Hôm qua";
  if (diff === 7) return "✨ Bạn của 7 ngày trước";
  return `${diff} ngày trước`;
};

const Journal = () => {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [moodCode, setMoodCode] = useState<JournalMoodCode>("NEUTRAL");
  const [isWriting, setIsWriting] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"LIST" | "TIMELINE">("LIST");

  const microcopy =
    microcopies[Math.floor(Date.now() / 86400000) % microcopies.length];

  // List journal entries
  const { data } = useQuery({
    queryKey: ["journal-list"],
    queryFn: () => journalApi.list(),
  });

  // Highlight from 2-4 days ago
  const { data: highlightData } = useQuery({
    queryKey: ["journal-highlight"],
    queryFn: () => journalApi.highlight(),
  });

  const entries: JournalResponse[] = data?.data ?? [];
  const highlights: JournalResponse[] = highlightData?.data ?? [];
  const threeDaysAgo = highlights[0] ?? null;

  // Create entry
  const { mutate: createEntry, isPending } = useMutation({
    mutationFn: () =>
      journalApi.create({ moodCode, content: text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-list"] });
      qc.invalidateQueries({ queryKey: ["journal-highlight"] });
      setText("");
      setIsWriting(false);
      setSavedMsg("Mình đã giữ điều này giúp bạn 💜");
      setTimeout(() => setSavedMsg(null), 3000);
    },
    onError: () => toast.error("Không thể lưu, thử lại nhé"),
  });

  // Delete entry
  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id: number) => journalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal-list"] });
      toast.success("Đã xoá 💜");
    },
    onError: () => toast.error("Không thể xoá, thử lại nhé"),
  });

  const addEntry = () => {
    if (!text.trim() || isPending) return;
    createEntry();
  };

  const moodEmoji = (code: JournalMoodCode) =>
    MOOD_OPTIONS.find((m) => m.code === code)?.emoji ?? "😐";

  return (
    <div
      className={`min-h-screen healing-gradient-bg px-6 pt-12 pb-24 transition-transform duration-[4000ms] ${
        isWriting ? "breathing-bg" : ""
      }`}
    >
      <div className="max-w-[420px] mx-auto page-enter">
        <h1 className="text-xl font-light text-foreground mb-1">Nhật ký</h1>
        <p className="text-sm text-muted-foreground mb-6">Viết ra để nhẹ lòng hơn</p>

        {/* Highlight from past */}
        {threeDaysAgo && (
          <div className="healing-card p-4 mb-6 border-primary/20 float-up">
            <p className="text-xs text-primary/70 mb-1">💜 Nhìn lại</p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {Math.floor(
                (Date.now() - new Date(threeDaysAgo.entryAt).getTime()) / 86400000
              )}{" "}
              ngày trước bạn đã viết: "
              {threeDaysAgo.content?.slice(0, 60)}..."
            </p>
            <p className="text-xs text-primary/60 mt-2">
              Hôm nay bạn ổn hơn một chút rồi.
            </p>
          </div>
        )}

        {/* Microcopy */}
        <p className="text-xs text-muted-foreground/50 italic mb-3 fade-in-slow">
          {microcopy}
        </p>

        {/* Write area */}
        <div
          className={`healing-card p-5 mb-4 transition-all duration-700 ${
            isWriting ? "healing-glow border-primary/20" : ""
          }`}
        >
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!isWriting) setIsWriting(true);
            }}
            onBlur={() => !text && setIsWriting(false)}
            placeholder="Hôm nay bạn muốn nói gì?"
            className={`w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none glow-cursor transition-all duration-700 leading-relaxed ${
              isWriting ? "h-36" : "h-16"
            }`}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(({ code, emoji }) => (
                <button
                  key={code}
                  onClick={() => setMoodCode(code)}
                  className={`text-lg transition-all duration-300 btn-press ${
                    moodCode === code ? "scale-125" : "opacity-30 hover:opacity-60"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {text.trim() && (
              <button
                id="save-journal-btn"
                onClick={addEntry}
                disabled={isPending}
                className="text-xs bg-primary/20 text-primary px-5 py-2 rounded-full hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
              >
                {isPending ? "Đang lưu..." : "Giữ lại"}
              </button>
            )}
          </div>
        </div>

        {/* Save feedback */}
        {savedMsg && (
          <div className="text-center mb-6 float-up">
            <p className="text-xs text-primary/70">{savedMsg}</p>
          </div>
        )}

        {/* Tabs Selection */}
        <div className="flex bg-card/60 border border-border/10 p-1 rounded-xl mb-6 float-up">
           <button 
             onClick={() => setActiveTab("LIST")}
             className={`flex-1 text-[13px] py-2.5 rounded-lg transition-all duration-300 ${activeTab === "LIST" ? "bg-primary/20 text-primary font-medium shadow-[0_0_10px_rgba(167,139,250,0.1)]" : "text-muted-foreground/60 hover:text-foreground/80"}`}
           >
             Trang viết
           </button>
           <button 
             onClick={() => setActiveTab("TIMELINE")}
             className={`flex-1 text-[13px] py-2.5 rounded-lg transition-all duration-300 ${activeTab === "TIMELINE" ? "bg-primary/20 text-primary font-medium shadow-[0_0_10px_rgba(167,139,250,0.1)]" : "text-muted-foreground/60 hover:text-foreground/80"}`}
           >
             Bản đồ cảm xúc
           </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "TIMELINE" && (
            <div className="w-full fade-in-slow">
               <HealingTimeline />
            </div>
          )}

          {activeTab === "LIST" && (
            <div className="space-y-4 fade-in-slow">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="float-up relative pl-6"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="absolute left-0 top-3 w-2 h-2 rounded-full bg-primary/40" />
                  {i < entries.length - 1 && (
                    <div className="absolute left-[3px] top-5 w-0.5 h-full bg-border/20" />
                  )}
                  <div className="healing-card p-4 group hover:bg-card/80 transition-colors duration-500">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[11px] ${
                          formatDate(entry.entryAt).includes("✨")
                            ? "text-primary/70 font-medium"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {formatDate(entry.entryAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{moodEmoji(entry.moodCode)}</span>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-40 hover:!opacity-90 transition-opacity text-rose-400 p-1"
                          aria-label="Xoá"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] text-foreground/80 leading-relaxed font-light">
                      {entry.content}
                    </p>
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                 <div className="text-center pt-8 fade-in-slow">
                   <p className="text-sm text-muted-foreground/50 italic">Bạn chưa viết dòng nhật ký nào...</p>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;
