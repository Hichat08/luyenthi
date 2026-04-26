import api from "@/lib/axios";

export type LeaderboardPeriod = "weekly" | "monthly" | "all";

export type LeaderboardEntry = {
  rank: number | null;
  userId: string;
  displayName?: string;
  username?: string;
  avatarUrl?: string | null;
  userCode?: string;
  totalExams: number;
  totalSubmissions?: number;
  totalCorrect: number;
  totalWrong: number;
  averageTimeSpentSeconds?: number | null;
  accumulatedScore: number;
  streak: number;
};

export type DailyProgress = {
  completedExams: number;
  dailyTarget: number;
  remainingExams: number;
  progressPercentage: number;
};

export type ResultsOverviewPeriod = "all" | "weekly" | "monthly";

export type ResultsTrendPoint = {
  key: string;
  label: string;
  score: number;
};

export type ResultHistoryItem = {
  _id: string;
  examId: string;
  examTitle?: string;
  subject?: string;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  submittedAt: string;
};

export type ResultsOverview = {
  period: ResultsOverviewPeriod;
  summary: {
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    scoreDeltaPercent: number;
  };
  trend: ResultsTrendPoint[];
  attempts: ResultHistoryItem[];
  hasMore: boolean;
};

export const rankingService = {
  getLeaderboard: async (period: LeaderboardPeriod) => {
    const res = await api.get("/ranking", {
      params: { period },
      withCredentials: true,
    });

    return res.data as {
      period: LeaderboardPeriod;
      leaderboard: LeaderboardEntry[];
      currentUser: LeaderboardEntry;
    };
  },
  submitAttempt: async (payload: {
    examId: string;
    examTitle?: string;
    subject?: string;
    correctCount: number;
    wrongCount: number;
    timeSpentSeconds?: number;
  }) => {
    const res = await api.post("/ranking/attempts", payload, {
      withCredentials: true,
    });

    return res.data as {
      countedAsNewExam: boolean;
      rankingStats: LeaderboardEntry;
      todayProgress: DailyProgress;
    };
  },
  getTodayProgress: async () => {
    const res = await api.get("/ranking/today-progress", {
      withCredentials: true,
    });

    return res.data as DailyProgress;
  },
  getResultsOverview: async (period: ResultsOverviewPeriod, limit = 4) => {
    const res = await api.get("/ranking/results", {
      params: { period, limit },
      withCredentials: true,
    });

    return res.data as ResultsOverview;
  },
};
