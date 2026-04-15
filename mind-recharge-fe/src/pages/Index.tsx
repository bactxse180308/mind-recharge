import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homeApi, checkinApi, type CheckinRequest } from "@/services/homeApi";
import { useBootstrap } from "@/contexts/BootstrapContext";
import { HealingTimeline } from "@/components/HealingTimeline";
import { toast } from "sonner";

const MOOD_MAP = [
  {
    key: "BAD" as const,
    emoji: "😞",
    label: "Rất tệ",
    color: "from-red-900/20 to-transparent",
  },
  {
    key: "NEUTRAL" as const,
    emoji: "😐",
    label: "Bình thường",
    color: "from-amber-900/20 to-transparent",
  },
  {
    key: "BETTER" as const,
    emoji: "🙂",
    label: "Đỡ hơn",
    color: "from-emerald-900/20 to-transparent",
  },
];

const Index = () => {
  const qc = useQueryClient();
  const { randomQuote, moodResponse } = useBootstrap();

  // Home summary
  const { data: summaryData } = useQuery({
    queryKey: ["home-summary"],
    queryFn: () => homeApi.getSummary(),
  });

  // Today's check-in
  const { data: checkinData } = useQuery({
    queryKey: ["checkin-today"],
    queryFn: () => checkinApi.getToday(),
    retry: false,
  });

  const todayMoodKey = checkinData?.data?.moodLevel ?? null;
  const selectedIndex = todayMoodKey
    ? MOOD_MAP.findIndex((m) => m.key === todayMoodKey)
    : null;

  const summary = summaryData?.data;

  // Upsert check-in mutation
  const { mutate: doCheckin, isPending } = useMutation({
    mutationFn: (body: CheckinRequest) => checkinApi.upsertToday(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["checkin-today"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      // Prefer BE response text, fall back to bootstrap mood text
      const responseText = res.data?.responseText ?? moodResponse(res.data?.moodLevel ?? "");
      if (responseText) toast.success(responseText);
    },
    onError: () => toast.error("Không thể lưu cảm xúc, thử lại nhé"),
  });

  const handleMoodSelect = (idx: number) => {
    if (isPending) return;
    doCheckin({ moodLevel: MOOD_MAP[idx].key });
  };

  const selected = selectedIndex !== null && selectedIndex >= 0 ? selectedIndex : null;
  const checkinResponse = checkinData?.data?.responseText ?? null;

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center px-6 pt-20 pb-28">
      <div className="w-full max-w-[420px] text-center fade-in-slow">
        {/* Breathing orb */}
        <div className="mx-auto mb-10 w-20 h-20 rounded-full bg-primary/20 breathing healing-glow flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/40" />
        </div>

        <h1 className="text-2xl font-light text-foreground mb-2">
          Hôm nay bạn ổn không?
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Không cần giấu, ở đây an toàn mà
        </p>

        {/* Summary bar */}
        {summary && (
          <div className="flex justify-center gap-6 mb-8 text-xs text-muted-foreground/60">
            <span>✅ {summary.tasksDoneToday}/{summary.totalTasksToday} nhiệm vụ</span>
            <span>🌿 {summary.noContactStreakDays} ngày</span>
          </div>
        )}

        {/* Mood buttons */}
        <div className="flex justify-center gap-4 mb-10">
          {MOOD_MAP.map((mood, i) => (
            <button
              key={mood.key}
              id={`mood-${mood.key}`}
              onClick={() => handleMoodSelect(i)}
              disabled={isPending}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-500 ${
                selected === i
                  ? "bg-primary/15 scale-105 healing-glow"
                  : "bg-secondary/50 hover:bg-secondary"
              } disabled:opacity-60`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs text-muted-foreground">{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Response */}
        {selected !== null && (
          <div
            className={`float-up rounded-2xl p-6 bg-gradient-to-b ${MOOD_MAP[selected].color} border border-border/30`}
          >
            <p className="text-sm leading-relaxed text-foreground/90">
              {checkinResponse ||
                (selected === 0
                  ? "Không sao đâu, hôm nay khó khăn thì ngày mai sẽ nhẹ hơn."
                  : selected === 1
                  ? "Bình thường cũng là ổn. Từng bước nhỏ, bạn đang tiến về phía trước."
                  : "Tuyệt vời! Bạn đang ổn hơn bạn nghĩ. Tiếp tục nhé 💜")}
            </p>
          </div>
        )}

        {/* Quote from bootstrap */}
        <p className="mt-12 text-xs text-muted-foreground/60 italic leading-relaxed max-w-[300px] mx-auto">
          "{randomQuote()}"
        </p>

        {/* Healing Journey Timeline */}
        <div className="w-full mt-12 text-left">
           <HealingTimeline />
        </div>
      </div>
    </div>
  );
};

export default Index;
