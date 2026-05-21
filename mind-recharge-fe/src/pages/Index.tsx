import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { homeApi, checkinApi, type CheckinRequest } from "@/services/homeApi";
import { useBootstrap } from "@/contexts/BootstrapContext";
import { HealingTimeline } from "@/components/HealingTimeline";
import FriendsWidget from "@/components/FriendsWidget";
import { BookOpen, Heart, Compass, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const MOOD_MAP = [
  {
    key: "BAD" as const,
    emoji: "😞",
    label: "Rất tệ",
    bg: "from-rose-100/80 dark:from-red-900/20 to-transparent",
    activeBg: "bg-rose-50 dark:bg-rose-950/30 border-rose-300/60 dark:border-rose-800/30",
  },
  {
    key: "NEUTRAL" as const,
    emoji: "😐",
    label: "Bình thường",
    bg: "from-amber-100/80 dark:from-amber-900/20 to-transparent",
    activeBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-300/60 dark:border-amber-800/30",
  },
  {
    key: "BETTER" as const,
    emoji: "🙂",
    label: "Đỡ hơn",
    bg: "from-emerald-100/80 dark:from-emerald-900/20 to-transparent",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300/60 dark:border-emerald-800/30",
  },
];

const QUICK_LINKS = [
  { path: "/journal",  icon: BookOpen,      label: "Nhật ký",    color: "text-violet-500" },
  { path: "/tasks",   icon: Heart,          label: "Điều nhỏ",   color: "text-rose-400"   },
  { path: "/tracker", icon: Compass,        label: "Hành trình", color: "text-teal-500"   },
  { path: "/unsent",  icon: MessageCircle,  label: "Chưa gửi",   color: "text-sky-400"    },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const Index = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { randomQuote, moodResponse } = useBootstrap();

  const { data: summaryData } = useQuery({
    queryKey: ["home-summary"],
    queryFn: () => homeApi.getSummary(),
  });

  const { data: checkinData } = useQuery({
    queryKey: ["checkin-today"],
    queryFn: () => checkinApi.getToday(),
    retry: false,
  });

  const todayMoodKey = checkinData?.data?.moodLevel ?? null;
  const selectedIndex = todayMoodKey
    ? MOOD_MAP.findIndex((m) => m.key === todayMoodKey)
    : null;
  const selected = selectedIndex !== null && selectedIndex >= 0 ? selectedIndex : null;
  const checkinResponse = checkinData?.data?.responseText ?? null;
  const summary = summaryData?.data;

  const { mutate: doCheckin, isPending } = useMutation({
    mutationFn: (body: CheckinRequest) => checkinApi.upsertToday(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["checkin-today"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      const responseText = res.data?.responseText ?? moodResponse(res.data?.moodLevel ?? "");
      if (responseText) toast.success(responseText);
    },
    onError: () => toast.error("Không thể lưu cảm xúc, thử lại nhé"),
  });

  const handleMoodSelect = (idx: number) => {
    if (isPending) return;
    doCheckin({ moodLevel: MOOD_MAP[idx].key });
  };

  const taskProgress = summary
    ? Math.round((summary.tasksDoneToday / Math.max(summary.totalTasksToday, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center px-5 pt-20 pb-28">
      <div className="w-full max-w-[420px] fade-in-slow space-y-6 mt-4">

        {/* ── Hero ── */}
        <div className="text-center">
          {/* Breathing orb */}
          <div className="relative mx-auto mb-7 w-28 h-28 flex items-center justify-center">
            {/* Outer pulse rings */}
            <div
              className="absolute w-44 h-44 rounded-full border border-fuchsia-400/20 dark:border-fuchsia-400/15 breathing"
              style={{ animationDelay: "0s", animationDuration: "4.5s" }}
            />
            <div
              className="absolute w-36 h-36 rounded-full border border-purple-400/25 dark:border-purple-400/20 breathing"
              style={{ animationDelay: "0.8s", animationDuration: "4.5s" }}
            />
            {/* Main gradient orb */}
            <div
              className="relative w-28 h-28 rounded-full breathing flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 38% 32%, #f9a8d4, #a855f7 45%, #818cf8 80%)",
                boxShadow: "0 0 32px 6px rgba(168,85,247,0.25), 0 0 12px 2px rgba(249,168,212,0.2)",
              }}
            >
              {/* Inner shimmer */}
              <div
                className="absolute top-3 left-5 w-7 h-4 rounded-full bg-white/30 blur-md rotate-[-20deg]"
              />
              <span className="text-2xl select-none" style={{ textShadow: "0 0 12px rgba(255,255,255,0.6)" }}>
                💜
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-primary/60 uppercase tracking-widest mb-1">
            {getGreeting()} 👋
          </p>
          <h1 className="text-2xl font-light text-foreground mb-2">
            Hôm nay bạn ổn không?
          </h1>
          <p className="text-sm text-muted-foreground">
            Không cần giấu, ở đây an toàn mà
          </p>
        </div>

        {/* ── Stat cards ── */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="healing-card p-4">
              <p className="text-xs text-muted-foreground/60 mb-2">Nhiệm vụ hôm nay</p>
              <p className="text-2xl font-light text-foreground mb-2">
                {summary.tasksDoneToday}
                <span className="text-sm text-muted-foreground/50">/{summary.totalTasksToday}</span>
              </p>
              <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-700"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>
            <div className="healing-card p-4">
              <p className="text-xs text-muted-foreground/60 mb-2">Hành trình</p>
              <p className="text-2xl font-light text-foreground mb-1">
                {summary.noContactStreakDays}
                <span className="text-sm text-muted-foreground/50"> ngày</span>
              </p>
              <p className="text-xs text-teal-500/80 dark:text-teal-400/70">
                {summary.noContactStreakDays === 0
                  ? "Bắt đầu hành trình 🌱"
                  : summary.noContactStreakDays < 7
                  ? "Đang tiến về phía trước ✨"
                  : "Kiên định lắm! 💪"}
              </p>
            </div>
          </div>
        )}

        {/* ── Mood check-in ── */}
        <div className="healing-card p-5">
          <p className="text-xs text-muted-foreground/60 mb-4 text-center">Cảm xúc của bạn lúc này?</p>
          <div className="flex justify-center gap-3">
            {MOOD_MAP.map((mood, i) => (
              <button
                key={mood.key}
                id={`mood-${mood.key}`}
                onClick={() => handleMoodSelect(i)}
                disabled={isPending}
                className={`flex flex-col items-center gap-2 flex-1 py-4 rounded-2xl border transition-all duration-500 btn-press ${
                  selected === i
                    ? `${mood.activeBg} scale-[1.03] shadow-sm`
                    : "bg-secondary/40 dark:bg-secondary/50 border-border/30 hover:bg-secondary/70"
                } disabled:opacity-60`}
              >
                <span className="text-3xl">{mood.emoji}</span>
                <span className="text-[11px] text-muted-foreground font-medium">{mood.label}</span>
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className={`float-up mt-4 rounded-xl p-4 bg-gradient-to-b ${MOOD_MAP[selected].bg} border border-border/20`}>
              <p className="text-sm leading-relaxed text-foreground/85 text-center">
                {checkinResponse ||
                  (selected === 0
                    ? "Không sao đâu, hôm nay khó khăn thì ngày mai sẽ nhẹ hơn."
                    : selected === 1
                    ? "Bình thường cũng là ổn. Từng bước nhỏ, bạn đang tiến về phía trước."
                    : "Tuyệt vời! Bạn đang ổn hơn bạn nghĩ. Tiếp tục nhé 💜")}
              </p>
            </div>
          )}
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_LINKS.map(({ path, icon: Icon, label, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="healing-card flex flex-col items-center gap-2 py-4 btn-press hover:scale-[1.03] transition-transform"
            >
              <Icon size={20} className={color} strokeWidth={1.6} />
              <span className="text-[10px] text-muted-foreground/70 font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Quote ── */}
        <div className="healing-card p-5 relative overflow-hidden">
          <span className="absolute top-2 left-4 text-5xl font-serif text-primary/10 leading-none select-none">"</span>
          <p className="text-sm text-muted-foreground/70 italic leading-relaxed text-center pt-3 px-2">
            {randomQuote()}
          </p>
          <span className="absolute bottom-1 right-4 text-5xl font-serif text-primary/10 leading-none select-none rotate-180">"</span>
        </div>

        {/* ── Healing Timeline ── */}
        <div className="text-left">
          <HealingTimeline />
        </div>

        {/* ── Friends ── */}
        <FriendsWidget />

      </div>
    </div>
  );
};

export default Index;
