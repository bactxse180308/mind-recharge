import { useState } from "react";
import { Check } from "lucide-react";

interface Task {
  id: number;
  text: string;
  done: boolean;
  emoji: string;
  justCompleted: boolean;
}

const defaultTasks: Task[] = [
  { id: 1, text: "Không xem story của họ", done: false, emoji: "👁️", justCompleted: false },
  { id: 2, text: "Đi ra ngoài 15 phút", done: false, emoji: "🚶", justCompleted: false },
  { id: 3, text: "Không đọc lại tin nhắn cũ", done: false, emoji: "💬", justCompleted: false },
  { id: 4, text: "Uống đủ nước", done: false, emoji: "💧", justCompleted: false },
  { id: 5, text: "Viết 1 điều tốt về bản thân", done: false, emoji: "✨", justCompleted: false },
];

const completeMessages = [
  "Bạn vừa chọn bản thân 💜",
  "Một bước nhỏ, nhưng rất dũng cảm",
  "Bạn đang yêu mình hơn rồi",
  "Tiếp tục nhé, bạn đang rất tốt",
  "Mỗi điều nhỏ đều có ý nghĩa",
];

const DailyTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const toggle = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    
    setTasks(tasks.map(t => t.id === id ? { ...t, done: newDone, justCompleted: newDone } : t));
    
    if (newDone) {
      const msg = completeMessages[Math.floor(Math.random() * completeMessages.length)];
      setFeedbackMsg(msg);
      setTimeout(() => {
        setFeedbackMsg(null);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, justCompleted: false } : t));
      }, 2000);
    }
  };

  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;

  return (
    <div className="min-h-screen healing-gradient-bg px-6 pt-12 pb-24">
      <div className="max-w-[420px] mx-auto page-enter">
        <h1 className="text-xl font-light text-foreground mb-1">Điều nhỏ hôm nay</h1>
        <p className="text-sm text-muted-foreground mb-8">Từng bước nhỏ, không vội</p>

        {/* Soft progress */}
        <div className="healing-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-foreground/80">{completed}/{total} điều nhỏ hôm nay</span>
            {completed === total && <span className="text-xs text-primary float-up">Tuyệt vời! 💜</span>}
          </div>
          <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Feedback */}
        {feedbackMsg && (
          <div className="text-center mb-4 float-up">
            <p className="text-xs text-primary/70">{feedbackMsg}</p>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className={`w-full flex items-center gap-4 healing-card p-4 text-left transition-all duration-500 float-up btn-press ${
                task.done ? "opacity-50" : ""
              } ${task.justCompleted ? "task-complete" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                task.done ? "bg-primary/20 border-primary/40" : "border-border/50"
              }`}>
                {task.done && <Check size={12} className="text-primary" />}
              </div>
              <span className="text-base mr-1">{task.emoji}</span>
              <span className={`text-sm transition-all duration-500 ${task.done ? "line-through text-muted-foreground/50" : "text-foreground/80"}`}>
                {task.text}
              </span>
            </button>
          ))}
        </div>

        {completed > 0 && completed < total && (
          <p className="text-center text-xs text-muted-foreground/40 mt-8 italic fade-in-slow">
            Bạn đang ổn hơn bạn nghĩ
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyTasks;
