import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noContactApi, type DailyLogResponse } from "@/services/noContactApi";
import { toast } from "sonner";
import { useState } from "react";
import { BookOpen, Trophy, RotateCcw } from "lucide-react";
import { useBootstrap } from "@/contexts/BootstrapContext";

const milestones = [1, 3, 7, 14, 30, 60, 90];

const milestoneMessages: Record<number, string> = {
  1:  "Ngày đầu tiên — bước khó nhất đã qua 🌱",
  3:  "3 ngày rồi! Bạn đang giữ vững 💪",
  7:  "Một tuần! Cảm xúc đang dần ổn định hơn 🌿",
  14: "Hai tuần — não bạn đang được reset lại 🧠",
  30: "Một tháng! Bạn đã chứng minh bạn làm được 🏆",
  60: "Hai tháng — bạn mạnh mẽ hơn bạn nghĩ rất nhiều 🌟",
  90: "Ba tháng! Hành trình này đã thay đổi bạn mãi mãi 💜",
};

const defaultEncouragements = [
  "Bạn đang làm rất tốt 💜",
  "Mỗi ngày là một chiến thắng nhỏ",
  "Bạn mạnh mẽ hơn bạn nghĩ",
  "Tiếp tục nhé, mình tin bạn",
];

function formatLogDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  });
}

const NoContactTracker = () => {
  const { milestoneMessage } = useBootstrap();
  const qc = useQueryClient();
  const [resetInput, setResetInput] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [logInput, setLogInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["no-contact-current"],
    queryFn: () => noContactApi.getCurrent(),
    retry: false,
  });

  const journey = data?.data ?? null;
  const days = journey?.streakDays ?? 0;
  const isActive = journey?.status === "ACTIVE";

  const { data: statsData } = useQuery({
    queryKey: ["no-contact-stats"],
    queryFn: () => noContactApi.getStats(),
    enabled: isActive,
  });

  const { data: logsData } = useQuery({
    queryKey: ["no-contact-daily-logs"],
    queryFn: () => noContactApi.getDailyLogs(0, 5),
    enabled: isActive,
  });

  const { mutate: startJourney, isPending: isStarting } = useMutation({
    mutationFn: () => noContactApi.start(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["no-contact-current"] });
      qc.invalidateQueries({ queryKey: ["no-contact-stats"] });
      toast.success("Hành trình bắt đầu 🌱");
    },
    onError: () => toast.error("Không thể bắt đầu, thử lại nhé"),
  });

  const { mutate: resetJourney, isPending: isResetting } = useMutation({
    mutationFn: (reason?: string) =>
      noContactApi.reset({ resetReason: reason || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["no-contact-current"] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      qc.invalidateQueries({ queryKey: ["no-contact-stats"] });
      qc.invalidateQueries({ queryKey: ["no-contact-daily-logs"] });
      setShowResetConfirm(false);
      setResetInput("");
      toast.info("Đặt lại. Bắt đầu lại không phải thất bại 💜");
    },
    onError: () => toast.error("Không thể đặt lại, thử lại nhé"),
  });

  const { mutate: saveLog, isPending: isSavingLog } = useMutation({
    mutationFn: (content: string) => noContactApi.upsertDailyLog({ content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["no-contact-daily-logs"] });
      setLogInput("");
      toast.success("Đã lưu nhật ký 💜");
    },
    onError: () => toast.error("Không thể lưu nhật ký, thử lại nhé"),
  });

  const nextMilestone = milestones.find((m) => m > days) || 90;
  const progressPercent = Math.min((days / nextMilestone) * 100, 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  // Milestone celebration: show when current day exactly hits an achieved milestone
  const latestAchievedMilestone = journey?.achievedMilestones?.length
    ? Math.max(...journey.achievedMilestones)
    : null;
  const justHitMilestone =
    latestAchievedMilestone !== null && latestAchievedMilestone === days;

  const dbMilestoneMsg = milestoneMessage(days);
  const encouragement = justHitMilestone
    ? dbMilestoneMsg ?? milestoneMessages[days] ?? defaultEncouragements[days % defaultEncouragements.length]
    : defaultEncouragements[days % defaultEncouragements.length];

  const stats = statsData?.data;
  const logs: DailyLogResponse[] = logsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen healing-gradient-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center px-6 pt-20 pb-28 overflow-y-auto">
      <div className="max-w-[420px] w-full text-center page-enter mt-4">
        {!isActive ? (
          <div className="fade-in-slow">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center breathing">
              <span className="text-4xl">🌱</span>
            </div>
            <h1 className="text-xl font-light text-foreground mb-3">
              Bắt đầu hành trình
            </h1>
            <p className="text-sm text-muted-foreground mb-8 max-w-[280px] mx-auto leading-relaxed">
              Mỗi ngày không liên lạc là một bước gần hơn với chính mình
            </p>
            <button
              id="start-journey-btn"
              onClick={() => startJourney()}
              disabled={isStarting}
              className="bg-primary/20 text-primary px-8 py-3 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
            >
              {isStarting ? "Đang bắt đầu..." : "Bắt đầu đếm"}
            </button>
          </div>
        ) : (
          <div className="fade-in-slow">
            {/* Circle progress */}
            <div className="relative mx-auto w-48 h-48 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: "drop-shadow(0 0 8px hsl(260 60% 70% / 0.3))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-light text-foreground">{days}</span>
                <span className="text-xs text-muted-foreground mt-1">ngày</span>
              </div>
            </div>

            <h2 className="text-lg font-light text-foreground mb-2">
              Hành trình ngày {days}
            </h2>

            {/* Milestone celebration */}
            {justHitMilestone && (
              <div className="float-up healing-card p-4 mb-4 border border-primary/30 bg-primary/10">
                <p className="text-base mb-1">🎉</p>
                <p className="text-sm font-medium text-primary">{encouragement}</p>
              </div>
            )}

            <p className="text-sm mb-8 leading-relaxed max-w-[300px] mx-auto text-primary/60">
              {justHitMilestone ? "Hôm nay là một ngày đặc biệt!" : encouragement}
            </p>

            {/* Milestones */}
            <div className="healing-card p-5 mb-6">
              <div className="flex justify-between text-[11px] text-muted-foreground/50 mb-3">
                <span>Bắt đầu</span>
                <span>Ngày {nextMilestone} 🎯</span>
              </div>
              <div className="flex items-center gap-1">
                {milestones.map((m, i) => (
                  <div key={m} className="flex items-center flex-1">
                    <div className="flex flex-col items-center w-full">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all duration-500 ${
                          days >= m
                            ? "bg-primary/25 text-primary nav-glow"
                            : days >= m - 1
                            ? "bg-primary/10 text-primary/50 breathing"
                            : "bg-secondary/50 text-muted-foreground/30"
                        }`}
                      >
                        {days >= m ? "✓" : m}
                      </div>
                    </div>
                    {i < milestones.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                          days >= milestones[i + 1] ? "bg-primary/30" : "bg-border/20"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="healing-card p-4 mb-6 flex justify-around text-center">
                <div className="flex flex-col items-center gap-1">
                  <Trophy size={16} className="text-primary/60" />
                  <span className="text-xl font-light text-foreground">{stats.longestStreakDays}</span>
                  <span className="text-[10px] text-muted-foreground/50">kỷ lục (ngày)</span>
                </div>
                <div className="w-px bg-border/20" />
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw size={16} className="text-muted-foreground/40" />
                  <span className="text-xl font-light text-foreground">{stats.totalResets}</span>
                  <span className="text-[10px] text-muted-foreground/50">lần đặt lại</span>
                </div>
              </div>
            )}

            {/* Daily log */}
            <div className="healing-card p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-primary/60" />
                <span className="text-xs font-medium text-foreground/70">Nhật ký hôm nay</span>
              </div>
              <textarea
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
                placeholder="Hôm nay bạn cảm thấy thế nào trong hành trình?"
                rows={3}
                className="w-full bg-transparent text-sm text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none resize-none leading-relaxed"
              />
              {logInput.trim() && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => saveLog(logInput.trim())}
                    disabled={isSavingLog}
                    className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isSavingLog ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              )}

              {logs.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border/20 pt-4">
                  {logs.map((log) => (
                    <div key={log.id}>
                      <p className="text-[10px] text-muted-foreground/40 mb-0.5">
                        {formatLogDate(log.logDate)}
                      </p>
                      <p className="text-xs text-foreground/60 leading-relaxed">{log.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reset */}
            {!showResetConfirm ? (
              <button
                id="reset-btn"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              >
                Đặt lại
              </button>
            ) : (
              <div className="healing-card p-4 float-up space-y-3">
                <p className="text-sm font-medium text-rose-400/80">Đặt lại hành trình?</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed">
                  {days > 0
                    ? `${days} ngày của bạn sẽ về 0. Bắt đầu lại không phải thất bại, nhưng hãy chắc chắn bạn muốn điều này.`
                    : "Hành trình sẽ được đặt lại. Bắt đầu lại không phải thất bại."}
                </p>
                <p className="text-xs text-muted-foreground">Lý do (tuỳ chọn):</p>
                <input
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  placeholder="Không sao, bạn vẫn đang cố gắng..."
                  className="w-full bg-transparent text-sm text-foreground/80 placeholder:text-muted-foreground/30 focus:outline-none border-b border-border/20 pb-1"
                />
                <div className="flex gap-3 justify-center">
                  <button
                    id="confirm-reset-btn"
                    onClick={() => resetJourney(resetInput)}
                    disabled={isResetting}
                    className="text-xs text-rose-400/70 hover:text-rose-400 transition-colors disabled:opacity-50"
                  >
                    {isResetting ? "Đang đặt lại..." : "Xác nhận đặt lại"}
                  </button>
                  <button
                    onClick={() => { setShowResetConfirm(false); setResetInput(""); }}
                    className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoContactTracker;
