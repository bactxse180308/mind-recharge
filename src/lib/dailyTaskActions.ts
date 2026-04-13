export interface DailyTaskAction {
  label: string;
  path: string;
}

const DAILY_TASK_ACTIONS: Record<string, DailyTaskAction> = {
  WRITE_JOURNAL: {
    label: "Viết",
    path: "/journal",
  },
  DEEP_BREATH: {
    label: "Thở ngay",
    path: "/trigger",
  },
  LISTEN_MUSIC: {
    label: "Mở ngay",
    path: "/trigger",
  },
};

export const getDailyTaskAction = (
  taskCode: string
): DailyTaskAction | null => DAILY_TASK_ACTIONS[taskCode] ?? null;

