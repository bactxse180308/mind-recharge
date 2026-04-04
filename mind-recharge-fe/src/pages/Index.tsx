import { useState } from "react";

const moods = [
  { emoji: "😞", label: "Rất tệ", response: "Không sao đâu, hôm nay khó khăn thì ngày mai sẽ nhẹ hơn. Bạn đã rất dũng cảm rồi.", color: "from-red-900/20 to-transparent" },
  { emoji: "😐", label: "Bình thường", response: "Bình thường cũng là ổn. Từng bước nhỏ, bạn đang tiến về phía trước.", color: "from-amber-900/20 to-transparent" },
  { emoji: "🙂", label: "Đỡ hơn", response: "Tuyệt vời! Bạn đang ổn hơn bạn nghĩ. Tiếp tục nhé 💜", color: "from-emerald-900/20 to-transparent" },
];

const Index = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="min-h-screen healing-gradient-bg flex flex-col items-center justify-center px-6 pb-24">
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

        {/* Mood buttons */}
        <div className="flex justify-center gap-4 mb-10">
          {moods.map((mood, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-500 ${
                selected === i
                  ? "bg-primary/15 scale-105 healing-glow"
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className="text-xs text-muted-foreground">{mood.label}</span>
            </button>
          ))}
        </div>

        {/* Response */}
        {selected !== null && (
          <div className={`float-up rounded-2xl p-6 bg-gradient-to-b ${moods[selected].color} border border-border/30`}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {moods[selected].response}
            </p>
          </div>
        )}

        {/* Quote */}
        <p className="mt-12 text-xs text-muted-foreground/60 italic leading-relaxed max-w-[300px] mx-auto">
          "Bạn nhớ họ, nhưng bạn cũng nhớ mình đã từng mệt như thế nào"
        </p>
      </div>
    </div>
  );
};

export default Index;
