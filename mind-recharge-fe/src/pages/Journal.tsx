import { useState } from "react";

interface Entry {
  id: number;
  text: string;
  mood: string;
  date: Date;
}

const moodOptions = ["😞", "😐", "🙂", "😌", "💜"];

const microcopies = [
  "Bạn không cần viết hay, chỉ cần thật",
  "Không phải bạn nhớ họ, mà là bạn nhớ cảm giác",
  "Bạn không yếu, bạn chỉ đang cảm nhận",
  "Healing không phải là quên, mà là không còn đau",
];

const Journal = () => {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, text: "Hôm nay mình thấy nhẹ hơn một chút. Mình đã không mở tin nhắn cũ.", mood: "😌", date: new Date(Date.now() - 7 * 86400000) },
    { id: 2, text: "Vẫn nhớ, nhưng mình biết mình sẽ ổn.", mood: "😐", date: new Date(Date.now() - 3 * 86400000) },
  ]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😐");
  const [isWriting, setIsWriting] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const microcopy = microcopies[Math.floor(Date.now() / 86400000) % microcopies.length];

  const addEntry = () => {
    if (!text.trim()) return;
    setEntries([{ id: Date.now(), text, mood, date: new Date() }, ...entries]);
    setText("");
    setIsWriting(false);
    setSavedMsg("Mình đã giữ điều này giúp bạn 💜");
    setTimeout(() => setSavedMsg(null), 3000);
  };

  const formatDate = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return "Hôm nay";
    if (diff === 1) return "Hôm qua";
    if (diff === 7) return "✨ Bạn của 7 ngày trước";
    return `${diff} ngày trước`;
  };

  // Personalization: check if there's an entry from ~3 days ago
  const threeDaysAgo = entries.find(e => {
    const diff = Math.floor((Date.now() - e.date.getTime()) / 86400000);
    return diff >= 2 && diff <= 4;
  });

  return (
    <div className={`min-h-screen healing-gradient-bg px-6 pt-12 pb-24 transition-transform duration-[4000ms] ${isWriting ? "breathing-bg" : ""}`}>
      <div className="max-w-[420px] mx-auto page-enter">
        <h1 className="text-xl font-light text-foreground mb-1">Nhật ký</h1>
        <p className="text-sm text-muted-foreground mb-6">Viết ra để nhẹ lòng hơn</p>

        {/* Personalization wow moment */}
        {threeDaysAgo && (
          <div className="healing-card p-4 mb-6 border-primary/20 float-up">
            <p className="text-xs text-primary/70 mb-1">💜 Nhìn lại</p>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {Math.floor((Date.now() - threeDaysAgo.date.getTime()) / 86400000)} ngày trước bạn đã viết: "{threeDaysAgo.text.slice(0, 60)}..."
            </p>
            <p className="text-xs text-primary/60 mt-2">Hôm nay bạn ổn hơn một chút rồi.</p>
          </div>
        )}

        {/* Emotional microcopy before input */}
        <p className="text-xs text-muted-foreground/50 italic mb-3 fade-in-slow">{microcopy}</p>

        {/* Write area */}
        <div className={`healing-card p-5 mb-4 transition-all duration-700 ${isWriting ? "healing-glow border-primary/20" : ""}`}>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (!isWriting) setIsWriting(true); }}
            onBlur={() => !text && setIsWriting(false)}
            placeholder="Hôm nay bạn muốn nói gì?"
            className={`w-full bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none glow-cursor transition-all duration-700 leading-relaxed ${
              isWriting ? "h-36" : "h-16"
            }`}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {moodOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-lg transition-all duration-300 btn-press ${mood === m ? "scale-125" : "opacity-30 hover:opacity-60"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {text.trim() && (
              <button onClick={addEntry} className="text-xs bg-primary/20 text-primary px-5 py-2 rounded-full hover:bg-primary/30 transition-all btn-press">
                Giữ lại
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

        {/* Timeline */}
        <div className="space-y-4 mt-6">
          {entries.map((entry, i) => (
            <div key={entry.id} className="float-up relative pl-6" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="absolute left-0 top-3 w-2 h-2 rounded-full bg-primary/40" />
              {i < entries.length - 1 && <div className="absolute left-[3px] top-5 w-0.5 h-full bg-border/20" />}
              <div className="healing-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] ${formatDate(entry.date).includes("✨") ? "text-primary/70" : "text-muted-foreground/60"}`}>
                    {formatDate(entry.date)}
                  </span>
                  <span className="text-sm">{entry.mood}</span>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed">{entry.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Journal;
