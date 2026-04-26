import type { DailyProgress } from "@/services/rankingService";

const TODAY_PROGRESS_KEY = "today-progress-cache";
const TODAY_PROGRESS_EVENT = "today-progress-updated";

const DEFAULT_DAILY_TARGET = 10;

export const readTodayProgressCache = () => {
  const raw = sessionStorage.getItem(TODAY_PROGRESS_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DailyProgress;
  } catch {
    sessionStorage.removeItem(TODAY_PROGRESS_KEY);
    return null;
  }
};

export const saveTodayProgressCache = (progress: DailyProgress) => {
  sessionStorage.setItem(TODAY_PROGRESS_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(TODAY_PROGRESS_EVENT, { detail: progress }));
};

export const incrementTodayProgressCache = () => {
  const current =
    readTodayProgressCache() ?? {
      completedExams: 0,
      dailyTarget: DEFAULT_DAILY_TARGET,
      remainingExams: DEFAULT_DAILY_TARGET,
      progressPercentage: 0,
    };

  const nextCompletedExams = current.completedExams + 1;
  const nextProgress: DailyProgress = {
    completedExams: nextCompletedExams,
    dailyTarget: current.dailyTarget || DEFAULT_DAILY_TARGET,
    remainingExams: Math.max((current.dailyTarget || DEFAULT_DAILY_TARGET) - nextCompletedExams, 0),
    progressPercentage: Math.min(
      Math.round((nextCompletedExams / (current.dailyTarget || DEFAULT_DAILY_TARGET)) * 100),
      100
    ),
  };

  saveTodayProgressCache(nextProgress);
  return nextProgress;
};

export const subscribeTodayProgress = (listener: (progress: DailyProgress) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<DailyProgress>;

    if (customEvent.detail) {
      listener(customEvent.detail);
    }
  };

  window.addEventListener(TODAY_PROGRESS_EVENT, handler);

  return () => {
    window.removeEventListener(TODAY_PROGRESS_EVENT, handler);
  };
};
