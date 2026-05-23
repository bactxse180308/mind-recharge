export interface DailyTaskAction {
  label: string;
  path: string;
}

const DAILY_TASK_ACTIONS: Record<string, DailyTaskAction> = {
  // Map với mã GRAT_JOURNAL trong Database
  GRAT_JOURNAL: {
    label: "Viết ngay",
    path: "/journal",
  },
  // Map với mã MEDITATION trong Database
  MEDITATION: {
    label: "Thiền ngay",
    path: "/trigger", 
  },
  // Map với mã LISTEN_PODCAST trong Database
  LISTEN_PODCAST: {
    label: "Mở ngay",
    path: "/trigger",
  },
  WRITE_JOURNAL: {
    label: "Viết",
    path: "/journal",
  },
  DEEP_BREATH: {
    label: "Thở ngay",
    path: "/trigger",
  },
};

export const getDailyTaskAction = (
  taskCode: string
): DailyTaskAction | null => {
  if (!taskCode) return null;
  return DAILY_TASK_ACTIONS[taskCode.trim()] ?? null;
};

