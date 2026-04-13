import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { emotionalTriggerApi, type TriggerSessionResponse } from "@/services/emotionalTriggerApi";
import { toast } from "sonner";

const defaultReminders = [
  "Bạn đang muốn quay lại một nơi từng làm bạn tổn thương",
  "Nhớ lại cảm giác chờ đợi tin nhắn mà không bao giờ đến",
  "Họ đã chọn rời đi. Bạn hãy chọn ở lại với chính mình.",
  "Bạn xứng đáng được yêu đúng cách",
];

const EmotionalTrigger = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<TriggerSessionResponse | null>(null);
  const [seconds, setSeconds] = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = session?.status === "RUNNING";

  // Countdown
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Start session
  const { mutate: startSession, isPending: isStarting } = useMutation({
    mutationFn: () => emotionalTriggerApi.startSession(),
    onSuccess: (res) => {
      setSession(res.data);
      setSeconds(res.data.durationSeconds ?? 600);
    },
    onError: () => toast.error("Không thể bắt đầu phiên, thử lại nhé"),
  });

  // Cancel session
  const { mutate: cancelSession } = useMutation({
    mutationFn: () => emotionalTriggerApi.cancelSession(session!.id),
    onSuccess: () => {
      setSession(null);
      navigate(-1);
    },
    onError: () => {
      // Still navigate away
      setSession(null);
      navigate(-1);
    },
  });

  // Complete session
  const { mutate: completeSession } = useMutation({
    mutationFn: () => emotionalTriggerApi.completeSession(session!.id),
    onSuccess: () => {
      setSession(null);
      toast.success("Bạn đã vượt qua 💜");
      navigate(-1);
    },
    onError: () => {
      setSession(null);
      navigate(-1);
    },
  });

  // Redirect to unsent
  const { mutate: redirectToUnsent } = useMutation({
    mutationFn: () => emotionalTriggerApi.redirectToUnsent(session!.id),
    onSuccess: () => {
      setSession(null);
      navigate("/unsent");
    },
    onError: () => {
      setSession(null);
      navigate("/unsent");
    },
  });

  // Circle SVG for countdown
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const totalDuration = session?.durationSeconds ?? 600;
  const progress = seconds / totalDuration;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(260 25% 8%), hsl(230 30% 6%), hsl(250 20% 5%))" }}
    >
      <div className="absolute inset-0 backdrop-blur-[1px] bg-background/30" />

      <div className="max-w-[380px] w-full text-center relative z-10 page-enter">
        {!isRunning ? (
          <>
            <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-destructive/8 flex items-center justify-center breathing">
              <span className="text-2xl">⚠️</span>
            </div>

            <h1 className="text-xl font-light text-foreground mb-2">Đợi đã...</h1>
            <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
              Trước khi nhắn, hãy cảm nhận lại những điều này
            </p>

            <div className="space-y-3 mb-8">
              {defaultReminders.map((r, i) => (
                <div
                  key={i}
                  className="healing-card p-4 text-left float-up border-border/20"
                  style={{ animationDelay: `${i * 0.2}s` }}
                >
                  <p className="text-sm text-foreground/70 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/40 italic mb-10 leading-relaxed">
              "Healing không phải là quên, mà là không còn đau"
            </p>

            <div className="flex flex-col gap-3">
              <button
                id="start-trigger-btn"
                onClick={() => startSession()}
                disabled={isStarting}
                className="bg-primary/20 text-primary px-6 py-3.5 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press disabled:opacity-50"
              >
                {isStarting ? "Đang bắt đầu..." : "Đợi thêm 10 phút"}
              </button>
              <button
                id="go-unsent-from-trigger-btn"
                onClick={() => {
                  if (session) redirectToUnsent();
                  else navigate("/unsent");
                }}
                className="bg-secondary/30 text-muted-foreground px-6 py-3.5 rounded-2xl text-sm hover:bg-secondary/50 transition-all btn-press"
              >
                Viết vào tin nhắn chưa gửi
              </button>
              <button
                id="go-back-trigger-btn"
                onClick={() => navigate(-1)}
                className="text-xs text-muted-foreground/30 mt-3 hover:text-muted-foreground/60 transition-colors"
              >
                Mình ổn rồi, quay lại
              </button>
            </div>
          </>
        ) : (
          <div className="fade-in-slow">
            {/* Circle countdown */}
            <div className="relative mx-auto w-40 h-40 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(230 15% 15%)" strokeWidth="3" />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="hsl(260 40% 65%)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-1000"
                  style={{ filter: "drop-shadow(0 0 10px hsl(260 60% 70% / 0.3))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center breathing">
                <span className="text-3xl font-light text-foreground">
                  {formatTime(seconds)}
                </span>
              </div>
            </div>

            <h2 className="text-lg font-light text-foreground mb-2">Hít thở sâu</h2>
            <p className="text-sm text-muted-foreground/60 mb-4 leading-relaxed">
              Cảm xúc này sẽ qua. Bạn đang làm rất tốt.
            </p>
            <p className="text-xs text-muted-foreground/30 italic mb-8">
              "Bạn không yếu, bạn chỉ đang cảm nhận"
            </p>

            <div className="flex flex-col gap-3">
              {seconds === 0 && (
                <button
                  id="complete-trigger-btn"
                  onClick={() => completeSession()}
                  className="bg-primary/20 text-primary px-6 py-3 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press"
                >
                  Mình đã vượt qua 💜
                </button>
              )}
              <button
                id="cancel-trigger-btn"
                onClick={() => cancelSession()}
                className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                Mình ổn rồi, quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionalTrigger;
