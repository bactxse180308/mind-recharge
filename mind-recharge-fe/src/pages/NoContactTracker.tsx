import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { noContactApi, type NoContactJourneyResponse } from "@/services/noContactApi";
import { toast } from "sonner";
import { useState } from "react";

const milestones = [1, 3, 7, 14, 30, 60, 90];

const defaultEncouragements = [
  "Bạn đang làm rất tốt 💜",
  "Mỗi ngày là một chiến thắng nhỏ",
  "Bạn mạnh mẽ hơn bạn nghĩ",
  "Tiếp tục nhé, mình tin bạn",
];

const NoContactTracker = () => {
  const qc = useQueryClient();
  const [resetInput, setResetInput] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["no-contact-current"],
    queryFn: () => noContactApi.getCurrent(),
    retry: false,
  });

  const journey: NoContactJourneyResponse | null = data?.data ?? null;
  const days = journey?.streakDays ?? 0;
  const isActive = journey?.status === "ACTIVE";

  const { mutate: startJourney, isPending: isStarting } = useMutation({
    mutationFn: () => noContactApi.start(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["no-contact-current"] });
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
      setShowResetConfirm(false);
      setResetInput("");
      toast.info("Đặt lại. Bắt đầu lại không phải thất bại 💜");
    },
    onError: () => toast.error("Không thể đặt lại, thử lại nhé"),
  });

  const nextMilestone = milestones.find((m) => m > days) || 90;
  const progressPercent = Math.min((days / nextMilestone) * 100, 100);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  const milestoneMsg = journey?.achievedMilestones?.includes(days)
    ? null
    : null;
  const encouragement =
    milestoneMsg ||
    defaultEncouragements[days % defaultEncouragements.length];

  if (isLoading) {
    return (
      <div className="min-h-screen healing-gradient-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6 pb-24">
      <div className="max-w-[420px] w-full text-center page-enter">
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
                  stroke="hsl(230 15% 20%)"
                  strokeWidth="4"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="hsl(260 40% 65%)"
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
            <p className="text-sm mb-8 leading-relaxed max-w-[300px] mx-auto text-primary/60">
              {encouragement}
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
                    onClick={() => setShowResetConfirm(false)}
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
