import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getDailyTaskAction } from "@/lib/dailyTaskActions";
import { dailyTaskApi, type DailyTaskResponse } from "@/services/dailyTaskApi";

const completeMessages = [
  "Tốt lắm, thêm một bước nhỏ.",
  "Bạn đang làm rất ổn.",
  "Một điều nhỏ nữa vừa được hoàn thành.",
  "Nhẹ nhàng thôi, bạn vẫn đang tiến lên.",
  "Mỗi điều nhỏ hôm nay đều có ý nghĩa.",
];

const getISODate = (d: Date) => {
  const offset = d.getTimezoneOffset();
  const adjustedDate = new Date(d.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split("T")[0];
};

const formatHeaderDate = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  });

const getProgressCopy = (completed: number, total: number, isToday: boolean) => {
  if (total === 0) {
    return isToday
      ? "Hôm nay chưa có điều nhỏ nào được tạo."
      : "Ngày này chưa có điều nhỏ nào được ghi nhận.";
  }

  if (completed === total) {
    return isToday
      ? "Bạn đã hoàn thành trọn vẹn hôm nay."
      : "Ngày này đã được hoàn thành trọn vẹn.";
  }

  const remaining = total - completed;
  const percentage = Math.round((completed / total) * 100);

  if (isToday) {
    return completed === 0
      ? "Bắt đầu từ một điều nhỏ đầu tiên."
      : `Còn ${remaining} điều nhỏ nữa thôi. Bạn đã đi được ${percentage}%.`;
  }

  return `${completed}/${total} điều nhỏ đã được hoàn thành trong ngày này.`;
};

const getFooterCopy = (completed: number, total: number, isToday: boolean) => {
  if (total === 0) {
    return "Một ngày nhẹ hơn sẽ bắt đầu từ những việc rất nhỏ.";
  }

  if (completed === total) {
    return isToday
      ? "Hôm nay bạn đã chăm sóc bản thân rất tốt."
      : "Ngày đó bạn đã cố gắng nhiều hơn bạn nghĩ.";
  }

  if (completed === 0) {
    return isToday
      ? "Chỉ cần bắt đầu từ điều nhỏ nhất, nhịp của bạn sẽ quay lại."
      : "Đó là một ngày đang dang dở, nhưng vẫn có giá trị.";
  }

  return isToday
    ? "Hôm nay bạn đang chăm sóc bản thân tốt hơn một chút rồi."
    : "Ngày đó đã có những bước nhỏ được giữ lại.";
};

const DailyTasks = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [justCompletedCode, setJustCompletedCode] = useState<string | null>(null);

  const todayDate = new Date();
  const todayStr = getISODate(todayDate);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const isToday = selectedDate === todayStr;

  const { data, isLoading } = useQuery({
    queryKey: ["daily-tasks", selectedDate],
    queryFn: () =>
      isToday
        ? dailyTaskApi.getToday()
        : dailyTaskApi.getHistory(selectedDate, selectedDate),
  });

  const tasks: DailyTaskResponse[] = data?.data ?? [];

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.done !== b.done) {
          return Number(a.done) - Number(b.done);
        }
        return a.sortOrder - b.sortOrder;
      }),
    [tasks]
  );

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextTaskCode = sortedTasks.find((task) => !task.done)?.code ?? null;

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
          data: old.data.map((task: DailyTaskResponse) =>
            task.code === code ? { ...task, done: isDone } : task
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["daily-tasks", selectedDate], ctx.prev);
      }
      toast.error("Không thể cập nhật, thử lại nhé");
    },
    onSuccess: (_res, { isDone, code }) => {
      qc.invalidateQueries({ queryKey: ["daily-tasks", selectedDate] });
      qc.invalidateQueries({ queryKey: ["home-summary"] });

      if (isDone) {
        const msg =
          completeMessages[Math.floor(Math.random() * completeMessages.length)];
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
      toast.info("Bạn chỉ có thể cập nhật trạng thái cho hôm nay.");
      return;
    }
    toggleTask({ code: task.code, isDone: !task.done });
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(todayDate.getDate() - (6 - i));
    return d;
  });

  const formatDateLabel = (d: Date) => {
    if (getISODate(d) === todayStr) return "Hôm nay";
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
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-light text-foreground mb-1">
              {isToday ? "Điều nhỏ hôm nay" : "Nhìn lại điều nhỏ"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isToday
                ? "Từng bước nhỏ, không vội"
                : `Ngày ${formatHeaderDate(selectedDate)}`}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-right">
            <p className="text-[11px] text-muted-foreground/70">Tiến độ</p>
            <p className="text-sm font-semibold text-primary">{progressPercent}%</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/45">
              7 ngày gần đây
            </p>

            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="inline-flex items-center gap-1 rounded-full border border-border/20 bg-secondary/20 px-3 py-1.5 text-[11px] text-foreground/75 transition hover:bg-secondary/35"
              >
                <ChevronLeft size={12} />
                Về hôm nay
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {dates.map((d) => {
              const iso = getISODate(d);
              const isSelected = selectedDate === iso;
              const isChipToday = iso === todayStr;

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className={`flex h-[70px] min-w-[62px] flex-shrink-0 flex-col items-center justify-center rounded-[22px] border transition-all btn-press ${
                    isSelected
                      ? "border-white/80 bg-gradient-to-b from-primary/25 to-primary/10 text-primary shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                      : "border-transparent bg-secondary/25 text-muted-foreground/60 hover:bg-secondary/40"
                  }`}
                >
                  <span
                    className={`mb-1 text-[11px] ${
                      isChipToday && !isSelected ? "text-primary/80" : ""
                    }`}
                  >
                    {formatDateLabel(d)}
                  </span>
                  <span className={isSelected ? "text-lg font-semibold" : "text-base font-medium"}>
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="healing-card mb-4 border border-white/5 p-5 float-up">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground/90">
                {completed}/{total} điều nhỏ {isToday ? "hôm nay" : "ngày này"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground/80">
                {getProgressCopy(completed, total, isToday)}
              </p>
            </div>

            <div className="rounded-2xl bg-background/60 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/45">
                Hoàn thành
              </p>
              <p className="mt-1 text-base font-semibold text-primary">
                {progressPercent}%
              </p>
            </div>
          </div>

          <div className="h-2 rounded-full bg-secondary/45 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/55 via-primary to-white/80 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {nextTaskCode && (
            <p className="mt-3 text-[11px] text-muted-foreground/70">
              Việc tiếp theo đang được làm nổi để bạn dễ bắt đầu hơn.
            </p>
          )}
        </div>

        {feedbackMsg && (
          <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-center float-up">
            <p className="text-sm text-primary">{feedbackMsg}</p>
          </div>
        )}

        <div className="space-y-3">
          {sortedTasks.map((task, index) => {
            const isDone = task.done;
            const isNext = !isDone && task.code === nextTaskCode;
            const action = isToday && !isDone ? getDailyTaskAction(task.code) : null;

            return (
              <div
                key={task.code}
                className="float-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div
                  className={`relative overflow-hidden rounded-[28px] border transition-all duration-300 ${
                    isDone
                      ? "border-white/5 bg-card/80"
                      : isNext
                        ? "border-primary/30 bg-gradient-to-r from-primary/12 via-card to-card shadow-[0_0_0_1px_rgba(167,139,250,0.12)]"
                        : "border-white/6 bg-card"
                  } ${justCompletedCode === task.code ? "task-complete" : ""}`}
                >
                  {isNext && (
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
                  )}

                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      id={`task-${task.code}`}
                      onClick={() => toggle(task)}
                      className={`flex min-w-0 flex-1 items-center gap-3 rounded-[22px] text-left transition-all btn-press ${
                        isToday ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${
                          isDone
                            ? "border-primary/35 bg-primary/18"
                            : isNext
                              ? "border-primary/35 bg-primary/12 shadow-[0_0_18px_rgba(167,139,250,0.12)]"
                              : "border-border/40 bg-background/30"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 ${
                            isDone
                              ? "scale-110 border-primary/50 bg-primary/20 text-primary"
                              : "border-border/50 bg-transparent text-transparent"
                          }`}
                        >
                          <Check size={15} className={isDone ? "animate-in zoom-in-75 duration-200" : ""} />
                        </div>
                      </div>

                      <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-lg ${
                          isDone
                            ? "bg-secondary/35 opacity-80"
                            : isNext
                              ? "bg-primary/12"
                              : "bg-secondary/25"
                        }`}
                      >
                        <span>{task.emoji}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          {isNext && (
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Tiếp theo
                            </span>
                          )}
                          {isDone && (
                            <span className="rounded-full border border-white/8 bg-secondary/25 px-2 py-0.5 text-[10px] text-muted-foreground/75">
                              Đã xong
                            </span>
                          )}
                          {!isToday && (
                            <span className="rounded-full border border-white/8 bg-secondary/25 px-2 py-0.5 text-[10px] text-muted-foreground/75">
                              Chế độ xem lại
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-[15px] leading-6 transition-all ${
                            isDone
                              ? "text-foreground/65"
                              : "font-medium text-foreground/95"
                          }`}
                        >
                          {task.title}
                        </p>

                        {isNext && isToday && (
                          <p className="mt-1 text-[11px] text-muted-foreground/70">
                            Chạm để hoàn thành hoặc mở nhanh hành động phù hợp.
                          </p>
                        )}
                      </div>
                    </button>

                    {action && (
                      <button
                        type="button"
                        onClick={() => navigate(action.path)}
                        className="inline-flex h-11 flex-shrink-0 items-center gap-1 rounded-2xl border border-primary/18 bg-primary/10 px-3 text-xs font-medium text-primary transition hover:bg-primary/18 btn-press"
                      >
                        {action.label}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {total > 0 && (
          <div className="mt-6 rounded-[26px] border border-white/6 bg-card/85 p-5 text-center">
            <p className="text-sm leading-6 text-foreground/85">
              {getFooterCopy(completed, total, isToday)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              {completed === total
                ? "Bạn có thể nghỉ một chút, hôm nay đã đủ rồi."
                : isToday
                  ? "Chỉ cần thêm một điều nhỏ nữa, nhịp của bạn sẽ rõ hơn."
                  : "Mỗi ngày đều để lại dấu vết rất riêng."}
            </p>
          </div>
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
