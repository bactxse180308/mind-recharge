import { useState, useEffect } from "react";

const milestoneMessages: Record<number, string> = {
  1: "Khó nhất là bắt đầu. Bạn đã làm được.",
  3: "Bạn đang kiểm soát tốt hơn rồi.",
  7: "Não bạn đang dần quên họ. Tin mình đi.",
  14: "Hai tuần. Bạn mạnh hơn bạn tưởng.",
  30: "Một tháng. Bạn đã thay đổi rất nhiều.",
  60: "Bạn gần như tự do rồi.",
  90: "Bạn đã tự do. 💜",
};

const encouragements = [
  "Bạn đang làm rất tốt 💜",
  "Mỗi ngày là một chiến thắng nhỏ",
  "Bạn mạnh mẽ hơn bạn nghĩ",
  "Tiếp tục nhé, mình tin bạn",
  "Bạn đang ổn hơn bạn nghĩ",
];

const NoContactTracker = () => {
  const [days, setDays] = useState(() => {
    const saved = localStorage.getItem("nc-start");
    if (saved) return Math.floor((Date.now() - parseInt(saved)) / 86400000);
    return 0;
  });
  const [started, setStarted] = useState(() => !!localStorage.getItem("nc-start"));

  const start = () => {
    localStorage.setItem("nc-start", Date.now().toString());
    setDays(0);
    setStarted(true);
  };

  const reset = () => {
    localStorage.removeItem("nc-start");
    setDays(0);
    setStarted(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("nc-start");
    if (saved) {
      const interval = setInterval(() => {
        setDays(Math.floor((Date.now() - parseInt(saved)) / 86400000));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [started]);

  const milestones = [1, 3, 7, 14, 30, 60, 90];
  const nextMilestone = milestones.find(m => m > days) || 90;
  const progressPercent = Math.min((days / nextMilestone) * 100, 100);

  // Circle SVG math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  const currentMilestoneMsg = milestoneMessages[days];
  const encouragement = currentMilestoneMsg || encouragements[days % encouragements.length];

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6 pb-24">
      <div className="max-w-[420px] w-full text-center page-enter">
        {!started ? (
          <div className="fade-in-slow">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center breathing">
              <span className="text-4xl">🌱</span>
            </div>
            <h1 className="text-xl font-light text-foreground mb-3">Bắt đầu hành trình</h1>
            <p className="text-sm text-muted-foreground mb-8 max-w-[280px] mx-auto leading-relaxed">
              Mỗi ngày không liên lạc là một bước gần hơn với chính mình
            </p>
            <button onClick={start} className="bg-primary/20 text-primary px-8 py-3 rounded-2xl text-sm hover:bg-primary/30 transition-all btn-press">
              Bắt đầu đếm
            </button>
          </div>
        ) : (
          <div className="fade-in-slow">
            {/* Circle progress */}
            <div className="relative mx-auto w-48 h-48 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke="hsl(230 15% 20%)"
                  strokeWidth="4"
                />
                <circle
                  cx="100" cy="100" r={radius}
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
            <p className={`text-sm mb-8 leading-relaxed max-w-[300px] mx-auto ${currentMilestoneMsg ? "text-primary" : "text-primary/60"}`}>
              {encouragement}
            </p>

            {/* Milestones timeline */}
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
                      <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${days >= milestones[i + 1] ? "bg-primary/30" : "bg-border/20"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={reset} className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
              Đặt lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoContactTracker;
