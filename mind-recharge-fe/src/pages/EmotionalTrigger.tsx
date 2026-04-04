import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const reminders = [
  "Bạn đang muốn quay lại một nơi từng làm bạn tổn thương",
  "Nhớ lại cảm giác chờ đợi tin nhắn mà không bao giờ đến",
  "Họ đã chọn rời đi. Bạn hãy chọn ở lại với chính mình.",
  "Bạn xứng đáng được yêu đúng cách",
];

const EmotionalTrigger = () => {
  const navigate = useNavigate();
  const [waiting, setWaiting] = useState(false);
  const [seconds, setSeconds] = useState(600);

  useEffect(() => {
    if (!waiting) return;
    if (seconds <= 0) { setWaiting(false); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [waiting, seconds]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Circle for countdown
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds / 600;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, hsl(260 25% 8%), hsl(230 30% 6%), hsl(250 20% 5%))" }}
    >
      {/* Dark overlay blur effect */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-background/30" />

      <div className="max-w-[380px] w-full text-center relative z-10 page-enter">
        {!waiting ? (
          <>
            <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-destructive/8 flex items-center justify-center breathing">
              <span className="text-2xl">⚠️</span>
            </div>

            <h1 className="text-xl font-light text-foreground mb-2">
              Đợi đã...
            </h1>
            <p className="text-sm text-muted-foreground/70 mb-8 leading-relaxed">
              Trước khi nhắn, hãy cảm nhận lại những điều này
            </p>

            <div className="space-y-3 mb-8">
              {reminders.map((r, i) => (
                <div key={i} className="healing-card p-4 text-left float-up border-border/20" style={{ animationDelay: `${i * 0.2}s` }}>
                  <p className="text-sm text-foreground/70 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/40 italic mb-10 leading-relaxed">
              "Healing không phải là quên, mà là không còn đau"
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setWaiting(true); setSeconds(600); }}
                className="bg-primary/20 text-primary px-6 py-3.5 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press"
              >
                Đợi thêm 10 phút
              </button>
              <button
                onClick={() => navigate("/unsent")}
                className="bg-secondary/30 text-muted-foreground px-6 py-3.5 rounded-2xl text-sm hover:bg-secondary/50 transition-all btn-press"
              >
                Viết vào tin nhắn chưa gửi
              </button>
              <button
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
                  cx="80" cy="80" r={radius}
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
                <span className="text-3xl font-light text-foreground">{formatTime(seconds)}</span>
              </div>
            </div>

            <h2 className="text-lg font-light text-foreground mb-2">Hít thở sâu</h2>
            <p className="text-sm text-muted-foreground/60 mb-4 leading-relaxed">Cảm xúc này sẽ qua. Bạn đang làm rất tốt.</p>
            <p className="text-xs text-muted-foreground/30 italic mb-8">"Bạn không yếu, bạn chỉ đang cảm nhận"</p>

            <button
              onClick={() => { setWaiting(false); navigate(-1); }}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              Mình ổn rồi, quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionalTrigger;
