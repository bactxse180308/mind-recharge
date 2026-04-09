import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft } from "lucide-react";
import { dailyTaskApi, type DailyTaskResponse } from "@/services/dailyTaskApi";
import { toast } from "sonner";
import { useState } from "react";

const completeMessages = [
  "Bạn vừa chọn bản thân 💜",
  "Một bước nhỏ, nhưng rất dũng cảm",
  "Bạn đang yêu mình hơn rồi",
  "Tiếp tục nhé, bạn đang rất tốt",
  "Mỗi điều nhỏ đều có ý nghĩa",
];

const getISODate = (d: Date) => {
  const offset = d.getTimezoneOffset();
  const adjustedDate = new Date(d.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('T')[0];
};

const DailyTasks = () => {
  const qc = useQueryClient();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [justCompletedCode, setJustCompletedCode] = useState<string | null>(null);

  const todayDate = new Date();
  const todayStr = getISODate(todayDate);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  const { data, isLoading } = useQuery({
    queryKey: ["daily-tasks", selectedDate],
    queryFn: () => isToday ? dailyTaskApi.getToday() : dailyTaskApi.getHistory(selectedDate, selectedDate),
  });

  const tasks: DailyTaskResponse[] = data?.data ?? [];
  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  const { mutate: toggleTask } = useMutation({
    mutationFn: ({ code, isDone }: { code: string; isDone: boolean }) =>
      dailyTaskApi.updateStatus(code, isDone),
    onMutate: async ({ code, isDone }) => {
      await qc.cancelQueries({ queryKey: ["daily-tasks", selectedDate] });
      const prev = qc.getQueryData(["daily-tasks", selectedDate]);
      qc.setQueryData(["daily-tasks", selectedDate], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t: DailyTaskResponse) =>
            t.code === code ? { ...t, done: isDone } : t
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["daily-tasks", selectedDate], ctx.prev);
      toast.error("Không thể cập nhật, thử lại nhé");
    },
    onSuccess: (_res, { isDone, code }) => {
      qc.invalidateQueries({ queryKey: ["daily-tasks", selectedDate] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });
      if (isDone) {
        const msg = completeMessages[Math.floor(Math.random() * completeMessages.length)];
        setFeedbackMsg(msg);
        setJustCompletedCode(code);
        setTimeout(() => {
          setFeedbackMsg(null);
          setJustCompletedCode(null);
        }, 2000);
      }
    },
  });

  const toggle = (task: DailyTaskResponse) => {
    if (!isToday) {
      toast.info("Bạn chỉ có thể cập nhật trạng thái cho ngày hôm nay.");
      return;
    }
    toggleTask({ code: task.code, isDone: !task.done });
  };

  // Generate last 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(todayDate.getDate() - (6 - i));
    return d;
  });

  const formatDateLabel = (d: Date) => {
    if (getISODate(d) === todayStr) return "H.Nay";
    // T2, T3, v.v
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[d.getDay()];
  };

  if (isLoading && !tasks.length) {
    return (
      <div className="min-h-screen healing-gradient-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-primary/20 breathing healing-glow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen healing-gradient-bg px-5 pt-12 pb-24">
      <div className="max-w-[420px] mx-auto page-enter">
        <h1 className="text-xl font-light text-foreground mb-1">
          {isToday ? "Điều nhỏ hôm nay" : "Nhìn lại điều nhỏ"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isToday ? "Từng bước nhỏ, không vội" : "Hành trình quá khứ"}
        </p>

        {/* Date Selector */}
        <div className="flex items-center justify-between gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {dates.map((d) => {
            const iso = getISODate(d);
            const isSelected = selectedDate === iso;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`flex flex-col items-center justify-center w-12 h-16 rounded-2xl flex-shrink-0 transition-all btn-press ${
                  isSelected
                    ? "bg-primary/20 text-primary border border-primary/20"
                    : "bg-secondary/30 text-muted-foreground/60 border border-transparent hover:bg-secondary/50"
                }`}
              >
                <span className="text-[11px] mb-1">{formatDateLabel(d)}</span>
                <span className={`text-base ${isSelected ? "font-semibold" : "font-medium"}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="healing-card p-5 mb-4 float-up">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-foreground/80">
              {completed}/{total} điều nhỏ {isToday ? "hôm nay" : "ngày này"}
            </span>
            {completed === total && total > 0 && (
              <span className="text-xs text-primary float-up">Tuyệt vời! 💜</span>
            )}
          </div>
          <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full transition-all duration-700 ease-out"
              style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
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
              key={task.code}
              id={`task-${task.code}`}
              onClick={() => toggle(task)}
              className={`w-full flex items-center gap-4 healing-card p-4 text-left transition-all duration-500 float-up btn-press ${
                task.done ? "opacity-50" : ""
              } ${justCompletedCode === task.code ? "task-complete" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                  task.done ? "bg-primary/20 border-primary/40" : "border-border/50"
                }`}
              >
                {task.done && <Check size={12} className="text-primary" />}
              </div>
              <span className="text-base mr-1">{task.emoji}</span>
              <span
                className={`text-sm transition-all duration-500 ${
                  task.done
                    ? "line-through text-muted-foreground/50"
                    : "text-foreground/90"
                }`}
              >
                {task.title}
              </span>
            </button>
          ))}
        </div>

        {completed > 0 && completed < total && isToday && (
          <p className="text-center text-xs text-muted-foreground/40 mt-8 italic fade-in-slow">
            Bạn đang ổn hơn bạn nghĩ
          </p>
        )}

        {total === 0 && !isLoading && (
          <p className="text-center text-sm text-muted-foreground/50 mt-8">
            Chưa có ghi nhận nhiệm vụ nào
          </p>
        )}
      </div>
    </div>
  );
};

export default DailyTasks;
